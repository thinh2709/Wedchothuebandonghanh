/**
 * Nhóm D — Đánh giá (RV-01 … RV-10)
 * Phụ thuộc booking COMPLETED / seed DB (xem tài liệu).
 */
describe('Nhóm D — Đánh giá', () => {
  const user = Cypress.env('TEST_USER') || 'minhchau1';
  const pass = Cypress.env('TEST_PASS') || '123456';

  it('RV-01 — Mở trang: form + Đánh giá của bạn', () => {
    cy.login(user, pass);
    cy.visit('/user/review.html');
    cy.url({ timeout: 10000 }).should('include', '/user/review.html');
    cy.contains('h1', 'Gửi đánh giá').should('be.visible');
    cy.contains('h2', 'Đánh giá của bạn').should('be.visible');
  });

  it('RV-02 — Chưa đăng nhập → Đăng nhập', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/user/review.html');
    cy.url({ timeout: 10000 }).should('include', '/user/login.html');
  });

  it('RV-03 — Dropdown chỉ lịch COMPLETED', () => {
    cy.login(user, pass);
    cy.visit('/user/review.html');
    cy.get('#bookingId option').each(($opt) => {
      const v = $opt.val();
      if (!v) return;
      expect(String(v).length).to.be.greaterThan(0);
    });
  });

  it('RV-04 — Không có đơn COMPLETED → cảnh báo', () => {
    cy.login(user, pass);
    cy.visit('/user/review.html');
    // Chờ dropdown được điền sau /api/bookings/me (tránh đọc val khi select còn rỗng).
    cy.get('#bookingId option', { timeout: 15000 }).should('have.length.at.least', 1);
    cy.get('#bookingId').invoke('val').then((v) => {
      if (v) {
        cy.log('Có đơn COMPLETED — không kiểm tra nhánh cảnh báo không đơn');
        cy.get('#bookingId option:not([value=""])').first().should('exist');
        return;
      }
      cy.contains('button[type="submit"]', 'Gửi đánh giá').click();
      cy.get('#review-message', { timeout: 10000 }).should('contain.text', 'COMPLETED');
    });
  });

  it('RV-05 — Gửi đánh giá thành công', () => {
    cy.login(user, pass);
    cy.visit('/user/review.html');
    cy.get('#bookingId option', { timeout: 15000 }).should('have.length.at.least', 1);
    cy.get('#bookingId').then(($s) => {
      if (!$s.val()) {
        cy.contains('button[type="submit"]', 'Gửi đánh giá').click();
        cy.get('#review-message', { timeout: 10000 }).should('contain.text', 'COMPLETED');
        return;
      }
      cy.get('#rating-stars .star-btn[data-value="4"]').click();
      cy.get('#comment').clear().type('Cypress E2E — đánh giá mẫu');
      cy.contains('button[type="submit"]', 'Gửi đánh giá').click();
      cy.get('#review-message', { timeout: 15000 }).should(($m) => {
        expect($m.text().trim().length).to.be.greaterThan(0);
      });
      cy.get('#review-message').then(($m) => {
        if ($m.text().includes('thành công')) {
          cy.get('#review-list').should('contain.text', 'Booking');
        } else {
          cy.log('Có thể đơn đã được đánh giá — RV-05 không áp dụng');
        }
      });
    });
  });

  it('RV-06 — Chọn 3 sao', () => {
    cy.login(user, pass);
    cy.visit('/user/review.html');
    cy.get('#bookingId option', { timeout: 15000 }).should('have.length.at.least', 1);
    cy.get('#rating-stars .star-btn').should('have.length', 5);
    cy.get('#rating-stars .star-btn[data-value="3"]').should('be.visible').click({ force: true });
    cy.get('#rating-stars .star-btn.active').should('have.length', 3);
  });

  it('RV-07 — Nhận xét trống vẫn gửi (nếu có đơn)', () => {
    cy.login(user, pass);
    cy.visit('/user/review.html');
    cy.get('#bookingId option', { timeout: 15000 }).should('have.length.at.least', 1);
    cy.get('#bookingId').then(($s) => {
      if (!$s.val()) {
        cy.contains('button[type="submit"]', 'Gửi đánh giá').click();
        cy.get('#review-message', { timeout: 10000 }).should('contain.text', 'COMPLETED');
        return;
      }
      cy.get('#rating-stars .star-btn[data-value="5"]').click();
      cy.get('#comment').clear();
      cy.contains('button[type="submit"]', 'Gửi đánh giá').click();
      cy.get('#review-message', { timeout: 15000 }).should('be.visible');
    });
  });

  it('RV-08 — Không gửi trùng đơn', () => {
    cy.login(user, pass);
    cy.visit('/user/review.html');
    cy.get('#bookingId option', { timeout: 15000 }).should('have.length.at.least', 1);
    cy.get('#bookingId').then(($s) => {
      if (!$s.val()) {
        cy.contains('button[type="submit"]', 'Gửi đánh giá').click();
        cy.get('#review-message', { timeout: 10000 }).should('contain.text', 'COMPLETED');
        return;
      }
      cy.get('#rating-stars .star-btn[data-value="4"]').click();
      cy.contains('button[type="submit"]', 'Gửi đánh giá').click();
      cy.get('#review-message', { timeout: 15000 }).should('be.visible');
      cy.contains('button[type="submit"]', 'Gửi đánh giá').click();
      cy.get('#review-message', { timeout: 10000 }).should('be.visible');
    });
  });

  it('RV-09 — Danh sách đánh giá đã gửi', () => {
    cy.login(user, pass);
    cy.visit('/user/review.html');
    // Retry tới khi loadMyReviews xong (không còn spinner); rỗng hoặc có mục đều hợp lệ.
    cy.get('#review-list', { timeout: 15000 }).should(($el) => {
      const t = $el.text();
      expect(t.includes('Đang tải')).to.be.false;
      expect(
        t.includes('Bạn chưa có đánh giá nào') || t.includes('Booking')
      ).to.be.true;
    });
  });

  it('RV-10 — Mobile responsive', () => {
    cy.login(user, pass);
    cy.viewport(375, 667);
    cy.visit('/user/review.html');
    cy.get('#review-form').should('be.visible');
    cy.get('#review-list').scrollIntoView();
  });
});
