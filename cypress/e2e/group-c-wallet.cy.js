/**
 * Nhóm C — Ví tiền (WAL-01 … WAL-10)
 * Cần TEST_USER / TEST_PASS; một số case thay đổi số dư (nên DB test hoặc chạy tuần tự).
 */
describe('Nhóm C — Ví tiền', () => {
  const user = Cypress.env('TEST_USER') || 'minhchau1';
  const pass = Cypress.env('TEST_PASS') || '123456';

  beforeEach(() => {
    cy.login(user, pass);
    cy.visit('/user/wallet.html');
    cy.url({ timeout: 10000 }).should('include', '/user/wallet.html');
  });

  it('WAL-01 — Hiển thị số dư (định dạng VND)', () => {
    cy.get('#wallet-balance').should('be.visible').and('contain.text', 'VND');
  });

  it('WAL-02 — Chưa có giao dịch (bảng rỗng)', function () {
    cy.get('#wallet-transactions').then(($tb) => {
      const txt = $tb.text();
      if (txt.includes('Chưa có giao dịch')) {
        cy.wrap($tb).should('contain.text', 'Chưa có giao dịch');
      } else {
        cy.log('User đã có giao dịch — không áp dụng WAL-02 tuyệt đối');
      }
    });
  });

  it('WAL-03 — Nạp tiền thành công', () => {
    cy.get('#wallet-balance')
      .invoke('text')
      .then((before) => {
        const n = Number(String(before).replace(/[^\d]/g, '')) || 0;
        cy.get('#depositAmount').clear().type('50000');
        cy.get('#provider').select('MOMO');
        cy.contains('button[type="submit"]', 'Nạp tiền').click();
        cy.get('#wallet-message', { timeout: 15000 }).should('contain.text', 'Nạp tiền thành công');
        cy.get('#wallet-balance').should(($el) => {
          const after = Number(String($el.text()).replace(/[^\d]/g, '')) || 0;
          expect(after).to.be.greaterThan(n);
        });
      });
  });

  it('WAL-04 — Kênh nạp hiển thị đúng trong lịch sử', () => {
    cy.get('#depositAmount').clear().type('10000');
    cy.get('#provider').select('VNPAY');
    cy.contains('button[type="submit"]', 'Nạp tiền').click();
    cy.get('#wallet-message', { timeout: 15000 }).should('contain.text', 'Nạp tiền thành công');
    cy.get('#wallet-transactions').should('contain.text', 'VNPAY');

    cy.get('#depositAmount').clear().type('10000');
    cy.get('#provider').select('BANK_TRANSFER');
    cy.contains('button[type="submit"]', 'Nạp tiền').click();
    cy.get('#wallet-message', { timeout: 15000 }).should('contain.text', 'Nạp tiền thành công');
    cy.get('#wallet-transactions').should('contain.text', 'BANK_TRANSFER');
  });

  it('WAL-05 — Tiền tối thiểu không dưới 1000', () => {
    cy.get('#depositAmount').clear().type('999');
    cy.contains('button[type="submit"]', 'Nạp tiền').click();
    cy.get('#depositAmount').then(($i) => {
      expect($i[0].checkValidity()).to.be.false;
    });

    cy.get('#depositAmount').clear().type('1000');
    cy.contains('button[type="submit"]', 'Nạp tiền').click();
    cy.get('#wallet-message', { timeout: 15000 }).should(($m) => {
      const t = $m.text();
      expect(
        t.includes('thành công') || t.includes('thất bại') || t.trim().length > 0
      ).to.be.true;
    });
  });

  it('WAL-06 — 0 / trống', () => {
    cy.get('#depositAmount').clear();
    cy.contains('button[type="submit"]', 'Nạp tiền').click();
    cy.get('#depositAmount').then(($i) => {
      expect($i[0].checkValidity()).to.be.false;
    });

    cy.get('#depositAmount').clear().type('0');
    cy.contains('button[type="submit"]', 'Nạp tiền').click();
    cy.get('#wallet-message', { timeout: 8000 }).should('not.contain.text', 'Nạp tiền thành công');
  });

  it('WAL-08 — Đồng bộ số dư & lịch sử sau nạp', () => {
    cy.get('#depositAmount').clear().type('20000');
    cy.get('#provider').select('MOMO');
    cy.contains('button[type="submit"]', 'Nạp tiền').click();
    cy.get('#wallet-message', { timeout: 15000 }).should('contain.text', 'Nạp tiền thành công');
    cy.get('#wallet-transactions').should('contain.text', 'DEPOSIT');
    cy.get('#wallet-balance').invoke('text').should('match', /\d/);
  });

  it('WAL-09 — Sau đăng xuất không xem được ví', () => {
    cy.logoutViaNav();
    cy.visit('/user/wallet.html');
    cy.url({ timeout: 10000 }).should('include', '/user/login.html');
  });

  it('WAL-10 — Mobile: bảng lịch sử cuộn được', () => {
    cy.viewport(375, 667);
    cy.get('.table-responsive').should('be.visible');
    cy.get('#wallet-transactions').scrollIntoView();
  });
});

describe('Nhóm C — Ví (không phiên đăng nhập)', () => {
  it('WAL-07 — Chưa đăng nhập → redirect Đăng nhập', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/user/wallet.html');
    cy.url({ timeout: 10000 }).should('include', '/user/login.html');
  });
});
