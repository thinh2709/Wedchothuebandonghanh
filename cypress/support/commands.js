/**
 * Custom commands — docs/playwright-test-cases-40.md (Cypress).
 * Ghi đè bằng biến môi trường CYPRESS_* hoặc file cypress.env.json (copy từ cypress.env.example.json).
 */
Cypress.Commands.add('login', (username, password) => {
  cy.intercept('POST', '**/api/user/login').as('loginPost');
  cy.visit('/user/login.html');
  cy.get('#username').clear({ force: true });
  cy.get('#password').clear({ force: true });
  if (username) cy.get('#username').type(username, { force: true });
  if (password) cy.get('#password').type(password, { force: true });
  cy.contains('button[type="submit"]', 'Đăng nhập').click();
  cy.wait('@loginPost', { timeout: 30000 });
  // Cho handler JS (redirect window.location) chạy sau khi fetch resolve
  cy.wait(200);
});

Cypress.Commands.add('logoutViaNav', () => {
  cy.get('#logout-btn').should('be.visible').click();
  cy.url({ timeout: 10000 }).should('include', '/user/index.html');
});

/**
 * Đăng ký tài khoản khách mới (username + email ngẫu nhiên, đúng rule backend).
 * Trả về { username, password, email } qua cy.wrap để chain tiếp cy.login.
 */
Cypress.Commands.add('registerRandomUser', () => {
  const raw = `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const username = raw.slice(0, 30);
  const email = `${username}@e2e.test`;
  const password = 'E2Etest123!';
  cy.visit('/user/register.html');
  cy.get('#username').clear().type(username);
  cy.get('#password').clear().type(password);
  cy.get('#email').clear().type(email);
  cy.contains('button[type="submit"]', 'Đăng ký').click();
  cy.url({ timeout: 20000 }).should('include', '/user/login.html');
  return cy.wrap({ username, password, email });
});
