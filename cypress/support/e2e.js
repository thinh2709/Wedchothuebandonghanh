require('./commands');

/**
 * Không chèn before() chờ server ở đây — cy.request không retry ECONNREFUSED.
 * Dùng npm run cy:open (có wait-on) để chờ http://localhost:8080 sẵn sàng trước khi mở Cypress.
 */
