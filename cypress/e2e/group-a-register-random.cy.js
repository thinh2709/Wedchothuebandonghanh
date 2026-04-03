/**
 * Đăng ký tài khoản ngẫu nhiên + đăng nhập (smoke, không cần seed DB).
 */
describe('Đăng ký ngẫu nhiên', () => {
  it('đăng ký mới rồi đăng nhập vào trang chủ', () => {
    cy.registerRandomUser().then((creds) => {
      cy.login(creds.username, creds.password);
      cy.url({ timeout: 15000 }).should('include', '/user/index.html');
      cy.get('#top-nav').should('contain.text', creds.username);
    });
  });
});
