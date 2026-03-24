describe('COMPANION full flow: UI to API', () => {
  const now = Date.now();
  const companion = {
    username: Cypress.env('COMPANION_USERNAME') || `e2e_companion_${now}`,
    email: `e2e_companion_${now}@mail.com`,
    password: Cypress.env('COMPANION_PASSWORD') || '123456',
  };

  function registerIfNeeded() {
    if (Cypress.env('COMPANION_USERNAME')) return;
    cy.visit('/user/register.html');
    cy.get('#username').clear().type(companion.username);
    cy.get('#password').clear().type(companion.password);
    cy.get('#email').clear().type(companion.email);
    cy.get('#register-form').submit();
    cy.url().should('include', '/user/login.html');
  }

  function loginCompanion() {
    cy.intercept('POST', '/api/user/login').as('loginApi');
    cy.visit('/user/login.html');
    cy.get('#username').clear().type(companion.username);
    cy.get('#password').clear().type(companion.password);
    cy.get('#login-form').submit();
    cy.wait('@loginApi').its('response.statusCode').should('eq', 200);
  }

  before(() => {
    registerIfNeeded();
    loginCompanion();
    cy.request({
      method: 'POST',
      url: '/api/companions/register',
      failOnStatusCode: false,
      body: {
        bio: 'Companion seed by Cypress',
        hobbies: 'doc sach',
        appearance: 'lich su',
        availability: 'toi',
      },
    });
    cy.request('POST', '/api/user/logout');
  });

  it('cập nhật profile, online, lịch rảnh, bảng giá, booking workflow, rút tiền', () => {
    loginCompanion();
    cy.visit('/companion/profile.html');

    cy.intercept('PUT', '/api/companions/me/profile').as('updateProfileApi');
    cy.intercept('PUT', '/api/companions/me/identity').as('updateIdentityApi');
    cy.intercept('PUT', '/api/companions/me/media-skills').as('updateMediaApi');
    cy.get('#bio').clear().type('Companion profile updated from Cypress');
    cy.get('#hobbies').clear().type('du lich');
    cy.get('#appearance').clear().type('than thien');
    cy.get('#availability-text').clear().type('cuoi tuan');
    cy.get('#identity-number').clear().type('079123456789');
    cy.get('#identity-image-url').clear().type('https://example.com/cccd.jpg');
    cy.get('#portrait-image-url').clear().type('https://example.com/portrait.jpg');
    cy.get('#intro-media-urls').clear().type('https://example.com/intro.mp4');
    cy.get('#skills').clear().type('chat, outing');
    cy.get('#profile-form').submit();
    cy.wait('@updateProfileApi').its('response.statusCode').should('eq', 200);
    cy.wait('@updateIdentityApi').its('response.statusCode').should('eq', 200);
    cy.wait('@updateMediaApi').its('response.statusCode').should('eq', 200);

    cy.intercept('PATCH', '/api/companions/me/online').as('onlineApi');
    cy.get('#online-toggle').click({ force: true });
    cy.wait('@onlineApi').its('response.statusCode').should('eq', 200);

    cy.intercept('POST', '/api/companions/me/availabilities').as('addAvailabilityApi');
    cy.visit('/companion/operations.html');
    cy.get('#start-time').clear().type('2026-03-31T09:00');
    cy.get('#end-time').clear().type('2026-03-31T11:00');
    cy.get('#note').clear().type('slot from cypress');
    cy.get('#availability-form').submit();
    cy.wait('@addAvailabilityApi').its('response.statusCode').should('eq', 200);
    cy.get('#availability-body').should('contain.text', 'slot from cypress');

    cy.intercept('POST', '/api/companions/me/service-prices').as('addServiceApi');
    cy.get('#service-name').clear().type('Test service');
    cy.get('#service-price').clear().type('150');
    cy.get('#service-description').clear().type('service from cypress');
    cy.get('#service-price-form').submit();
    cy.wait('@addServiceApi').its('response.statusCode').should('eq', 200);
    cy.get('#service-price-body').should('contain.text', 'Test service');

    cy.intercept('GET', '/api/companions/me/bookings/workflow').as('workflowApi');
    cy.visit('/companion/bookings.html');
    cy.wait('@workflowApi').its('response.statusCode').should('eq', 200);
    cy.get('#wf-pending').should('exist');
    cy.get('#wf-upcoming').should('exist');
    cy.get('#wf-running').should('exist');
    cy.get('#wf-done').should('exist');

    cy.intercept('POST', '/api/companions/me/withdrawals').as('withdrawApi');
    cy.visit('/companion/finance.html');
    cy.get('#withdraw-amount').clear().type('1');
    cy.get('#bank-name').clear().type('VCB');
    cy.get('#bank-account-number').clear().type('123456789');
    cy.get('#account-holder-name').clear().type('E2E TEST');
    cy.get('#withdraw-form').submit();
    cy.wait('@withdrawApi').then(({ response }) => {
      expect([200, 400]).to.include(response.statusCode);
    });
    cy.get('#alert-box').should('not.be.empty');

    cy.request('POST', '/api/user/logout');
  });
});
