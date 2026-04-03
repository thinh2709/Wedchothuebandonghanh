/**
 * Nhóm A — Đăng nhập (LG-01 … LG-10)
 * Tài khoản mặc định: cypress.config.js env (seed dbtest).
 * E2E_REGISTER_RANDOM=true: before() tự đăng ký và ghi đè TEST_USER/TEST_PASS.
 */
describe('Nhóm A — Đăng nhập', () => {
  let user;
  let pass;

  before(function () {
    const reg = Cypress.env('E2E_REGISTER_RANDOM');
    const wantRegister = reg === true || String(reg).toLowerCase() === 'true';
    if (!wantRegister) {
      return;
    }
    cy.registerRandomUser().then((creds) => {
      Cypress.env('TEST_USER', creds.username);
      Cypress.env('TEST_PASS', creds.password);
    });
  });

  beforeEach(() => {
    // Tránh session LG-01 còn cookie khiến LG-02–LG-08 sai (hoặc input form lạ).
    cy.clearCookies();
    cy.clearLocalStorage();
    user = Cypress.env('TEST_USER');
    pass = Cypress.env('TEST_PASS');
  });

  it('LG-01 — Đăng nhập thành công (khách)', () => {
    cy.login(user, pass);
    cy.url({ timeout: 15000 }).should('include', '/user/index.html');
    cy.get('#top-nav').should('contain.text', user);
  });

  it('LG-02 — Sai mật khẩu', () => {
    cy.login(user, `${pass}_wrong`);
    cy.url().should('include', '/user/login.html');
    cy.get('#auth-message').should('contain.text', 'Sai tên đăng nhập hoặc mật khẩu');
  });

  it('LG-03 — Sai tên (user không tồn tại)', () => {
    cy.login('user_khong_ton_tai_xyz_999', 'batky');
    cy.url().should('include', '/user/login.html');
    cy.get('#auth-message').should('contain.text', 'Sai tên đăng nhập hoặc mật khẩu');
  });

  it('LG-04 — Tài khoản khóa (locked)', () => {
    const u = Cypress.env('TEST_LOCKED_USER');
    const p = Cypress.env('TEST_LOCKED_PASS');
    cy.login(u, p);
    cy.url().should('include', '/user/login.html');
    cy.get('#auth-message').should('contain.text', 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.');
  });

  it('LG-05 — Tài khoản cấm (BANNED)', () => {
    const u = Cypress.env('TEST_BANNED_USER');
    const p = Cypress.env('TEST_BANNED_PASS');
    cy.login(u, p);
    cy.url().should('include', '/user/login.html');
    cy.get('#auth-message').should('contain.text', 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.');
  });

  it('LG-06 — Cảnh báo (WARNED) vẫn vào app', () => {
    const u = Cypress.env('TEST_WARNED_USER');
    const p = Cypress.env('TEST_WARNED_PASS');
    cy.login(u, p);
    // Backend có delay ~1.2s khi có warningMessage; assert URL trang chủ là đủ.
    cy.url({ timeout: 20000 }).should('include', '/user/index.html');
  });

  it('LG-07 — User có hồ sơ Companion → Dashboard Companion', () => {
    const u = Cypress.env('TEST_COMPANION_USER');
    const p = Cypress.env('TEST_COMPANION_PASS');
    cy.login(u, p);
    cy.url({ timeout: 30000 }).should('include', '/companion/dashboard.html');
  });

  it('LG-08 — Đăng nhập Admin', () => {
    const u = Cypress.env('TEST_ADMIN_USER');
    const p = Cypress.env('TEST_ADMIN_PASS');
    cy.login(u, p);
    cy.url({ timeout: 30000 }).should('include', '/admin/dashboard.html');
  });

  it('LG-09 — Ô trống: HTML5 required', () => {
    cy.visit('/user/login.html');
    cy.get('#username').clear();
    cy.get('#password').clear();
    cy.get('#username').then(($el) => {
      expect($el[0].checkValidity()).to.be.false;
    });
  });

  it('LG-10 — Đăng xuất', () => {
    cy.login(user, pass);
    cy.url({ timeout: 15000 }).should('include', '/user/index.html');
    cy.logoutViaNav();
    cy.visit('/user/wallet.html');
    cy.url({ timeout: 10000 }).should('include', '/user/login.html');
  });
});
