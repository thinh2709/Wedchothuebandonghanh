describe('Auth Flow', () => {
  const now = Date.now();
  const username = `e2e_user_${now}`;
  const email = `e2e_${now}@mail.com`;
  const password = '123456';

  it('shows validation on register when confirm password mismatches', () => {
    cy.visit('/register');
    cy.get('#username').type(username);
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('#confirm-password').type('654321');
    cy.get('#register-form').submit();
    cy.contains(/Mật khẩu nhập lại không khớp\.|Mat khau nhap lai khong khop\./);
  });

  it('registers a new user successfully', () => {
    cy.visit('/register');
    cy.get('#username').clear().type(username);
    cy.get('#email').clear().type(email);
    cy.get('#password').clear().type(password);
    cy.get('#confirm-password').clear().type(password);
    cy.get('#register-form').submit();
    cy.url().should('include', '/login');
    cy.url().should('include', 'registered=1');
    cy.contains(/Đăng ký thành công.*đăng nhập|Dang ky thanh cong.*dang nhap/);
  });

  it('fails login with wrong password', () => {
    cy.visit('/login');
    cy.get('#username').type(username);
    cy.get('#password').type('wrongpass');
    cy.get('#login-form').submit();
    cy.url().should('include', '/login');
    cy.url().should('include', 'error=');
  });

  it('logs in with valid credentials and redirects user dashboard', () => {
    cy.visit('/login');
    cy.get('#username').clear().type(username);
    cy.get('#password').clear().type(password);
    cy.get('#login-form').submit();
    cy.url().should('include', '/user/index.html');
    cy.url().should('include', 'loginSuccess=1');
  });

  it('supports legacy /user/login URL without 404', () => {
    cy.visit('/user/login');
    cy.url().should('include', '/login');
  });
});
