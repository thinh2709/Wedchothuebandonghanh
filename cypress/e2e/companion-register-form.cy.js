describe('Companion đăng ký từ user', () => {
  const now = Date.now();
  // Backend đang validate username trong [4..30] ký tự, tránh dùng chuỗi quá dài.
  const suffix = String(now).slice(-6);
  const username = `e2eC_${suffix}`; // ~10 ký tự
  const email = `${username}@mail.com`;
  const password = '123456';

  const uiRegister = () => {
    cy.visit('/user/register.html');
    cy.get('#username').clear().type(username);
    cy.get('#password').clear().type(password);
    cy.get('#email').clear().type(email);
    cy.get('#register-form').submit();
    cy.url().should('include', '/user/login.html');
  };

  const uiLogin = () => {
    cy.intercept('POST', '/api/user/login').as('loginApi');
    cy.visit('/user/login.html');
    cy.get('#username').clear().type(username);
    cy.get('#password').clear().type(password);
    cy.get('#login-form').submit();
    cy.wait('@loginApi').its('response.statusCode').should('eq', 200);
    cy.url().should('include', '/user/index.html');
  };

  it('đăng ký companion không cần nhập Loại dịch vụ', () => {
    uiRegister();
    uiLogin();

    cy.visit('/companion/register.html');

    cy.get('#bio').clear().type('Companion đăng ký E2E từ Cypress');
    cy.get('#hobbies').clear().type('Đọc sách, xem phim');
    cy.get('#appearance').clear().type('Lịch sự, thân thiện');
    cy.get('#availability-option').select('Tối 2-6 (18:00 - 22:00)');
    cy.get('#area').clear().type('Quận 1');
    cy.get('#rental-venues').clear().type('Quán cafe ABC\nCông viên XYZ');
    cy.get('#gender').select('MALE');

    // Cố tình không nhập #service-type để đảm bảo không bị bắt nhập.

    cy.get('#register-form').submit();

    cy.contains('Gửi đăng ký thành công').should('exist');
    cy.url({ timeout: 15000 }).should('include', '/companion/dashboard.html');
    cy.contains('Tổng quan Companion').should('exist');
  });
});

