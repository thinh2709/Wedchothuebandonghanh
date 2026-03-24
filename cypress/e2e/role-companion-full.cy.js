describe('COMPANION full flow: UI to API', () => {
  const now = Date.now();
  const companion = {
    username: Cypress.env('COMPANION_USERNAME') || `e2e_companion_${now}`,
    email: `e2e_companion_${now}@mail.com`,
    password: Cypress.env('COMPANION_PASSWORD') || '123456',
  };

  function registerIfNeeded() {
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

  it('cập nhật profile, online, trang lịch (tự động), bảng giá, workflow, bank-account, rút tiền', () => {
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
    cy.request('/api/companions/me/profile').its('body.onlineStatus').should('eq', true);

    cy.intercept('GET', '/api/companions/me/profile').as('opsProfileApi');
    cy.intercept('GET', '/api/companions/me/bookings').as('opsBookingsApi');
    cy.visit('/companion/operations.html');
    cy.wait('@opsProfileApi').its('response.statusCode').should('eq', 200);
    cy.wait('@opsBookingsApi').its('response.statusCode').should('eq', 200);
    cy.get('#availability-mode-hint').invoke('text').should('match', /online|ONLINE|rảnh toàn bộ/i);
    cy.get('#availability-body').should('contain.text', 'Hiện chưa có khung giờ bận nào');

    cy.intercept('POST', '/api/companions/me/service-prices').as('addServiceApi');
    cy.get('#service-name').clear().type('Test service');
    cy.get('#service-price').clear().type('150000');
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

    cy.intercept('PUT', '/api/companions/me/bank-account').as('saveBankApi');
    cy.intercept('POST', '/api/companions/me/withdrawals').as('withdrawApi');
    cy.visit('/companion/finance.html');
    cy.get('#bank-name').clear().type('VCB');
    cy.get('#bank-account-number').clear().type('123456789');
    cy.get('#account-holder-name').clear().type('E2E TEST');
    cy.get('#bank-account-form').submit();
    cy.wait('@saveBankApi').its('response.statusCode').should('eq', 200);
    cy.get('#alert-box').invoke('text').should('match', /ngân hàng|lưu/i);

    cy.get('#withdraw-amount').clear().type('1');
    cy.get('#withdraw-form').submit();
    cy.wait('@withdrawApi').then(({ response }) => {
      expect([200, 400]).to.include(response.statusCode);
    });
    cy.get('#alert-box').should('not.be.empty');
    cy.get('#withdrawal-body').should('exist');

    cy.request('POST', '/api/user/logout');
  });
});
