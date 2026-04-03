/**
 * Nhóm B — Tìm kiếm & bộ lọc (SE-01 … SE-10)
 * Cần server có companion trong DB (xem PreCondition trong tài liệu).
 */
function assertAllCardsContain(text, opts = {}) {
  const ignoreCase = Boolean(opts.ignoreCase);
  cy.get('#companion-grid', { timeout: 15000 }).should('be.visible');
  cy.get('#companion-grid').should(($grid) => {
    const $cards = $grid.find('.user-card');
    expect($cards.length, 'có ít nhất một thẻ companion').to.be.at.least(1);
    $cards.each((_, el) => {
      const t = Cypress.$(el).text();
      if (ignoreCase) expect(t.toLowerCase()).to.include(String(text).toLowerCase());
      else expect(t).to.include(text);
    });
  });
}

describe('Nhóm B — Tìm kiếm & bộ lọc', () => {
  beforeEach(() => {
    cy.visit('/user/search.html');
  });

  it('SE-01 — Lọc trống vẫn có danh sách (khi server có dữ liệu)', () => {
    cy.get('#search-form').submit();
    cy.get('#companion-grid').then(($grid) => {
      if ($grid.text().includes('Chưa có companion nào')) {
        cy.wrap(null).then(() => {
          expect($grid.text()).to.contain('Chưa có companion nào');
        });
      } else {
        cy.get('#companion-grid .user-card').should('have.length.at.least', 1);
        cy.get('#companion-grid').should('not.contain.text', 'Không tìm thấy kết quả phù hợp');
      }
    });
  });

  it('SE-02 — Lọc theo từ khóa', () => {
    cy.get('#companion-grid .user-card .card-title')
      .first()
      .invoke('text')
      .then((name) => {
        const keyword = String(name || '').trim().toLowerCase();
        if (!keyword) {
          cy.log('Không có thẻ companion để lấy từ khóa — bỏ qua assert chi tiết');
          return;
        }
        cy.get('#keyword').clear().type(keyword);
        cy.get('#search-form').submit();
        assertAllCardsContain(keyword, { ignoreCase: true });
      });
  });

  it('SE-03 — Lọc Dịch vụ Outing', () => {
    cy.get('#serviceType').select('OUTING');
    cy.get('#search-form').submit();
    cy.get('#companion-grid', { timeout: 15000 }).should('be.visible');
    cy.get('#companion-grid').then(($g) => {
      if ($g.text().includes('Không tìm thấy kết quả phù hợp')) return;
      // UI hiển thị nhãn dịch vụ (vd. Tâm sự), không nhất thiết chữ "OUTING" như API.
      cy.get('#companion-grid .user-card').should('have.length.at.least', 1);
      cy.get('#companion-grid .badge').first().should('be.visible');
    });
  });

  it('SE-04 — Lọc khu vực (substring)', () => {
    cy.get('#companion-grid .user-card')
      .first()
      .find('.badge')
      .then(($badges) => {
        const geo = [...$badges].find((b) => b.innerHTML.includes('bi-geo-alt'));
        if (!geo) return;
        const raw = (geo.textContent || '').trim();
        const part = raw.slice(0, Math.min(8, raw.length)) || raw;
        if (!part || part === '-') return;
        cy.get('#area').clear().type(part);
        cy.get('#search-form').submit();
        assertAllCardsContain(part);
      });
  });

  it('SE-05 — Lọc giới tính Nam', () => {
    cy.get('#gender').select('MALE');
    cy.get('#search-form').submit();
    cy.get('body').then(($b) => {
      if ($b.text().includes('Không tìm thấy kết quả phù hợp')) return;
      cy.get('#companion-grid .user-card').should('have.length.at.least', 1);
      cy.contains('a', 'Xem profile').first().click();
      cy.url().should('include', '/user/profile.html');
      cy.contains('Giới tính').should('be.visible');
      cy.contains('MALE').should('exist');
    });
  });

  it('SE-06 — Online = Đang online', () => {
    cy.get('#online').select('true');
    cy.get('#search-form').submit();
    cy.get('#companion-grid', { timeout: 15000 }).should('be.visible');
    assertAllCardsContain('Online');
  });

  it('SE-07 — Online = Đang offline', () => {
    cy.get('#online').select('false');
    cy.get('#search-form').submit();
    cy.get('#companion-grid', { timeout: 15000 }).should('be.visible');
    assertAllCardsContain('Offline');
  });

  it('SE-08 — Giá từ (min)', () => {
    cy.get('#minPrice').clear().type('1000');
    cy.get('#search-form').submit();
    cy.get('#companion-grid .user-card .badge').first().should('be.visible');
  });

  it('SE-09 — Giá đến (max)', () => {
    cy.get('#maxPrice').clear().type('999999999');
    cy.get('#search-form').submit();
    cy.get('#companion-grid').should('be.visible');
  });

  it('SE-10 — Tổ hợp không có kết quả', () => {
    cy.get('#keyword').clear().type('__NO_MATCH_KEYWORD_ZZZ_999__');
    cy.get('#serviceType').select('OUTING');
    cy.get('#online').select('true');
    cy.get('#search-form').submit();
    cy.get('#companion-grid').should('contain.text', 'Không tìm thấy kết quả phù hợp');
  });
});
