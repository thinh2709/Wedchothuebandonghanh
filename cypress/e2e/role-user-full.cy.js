describe('USER full flow: UI to API', () => {
  const now = Date.now();
  const customer = {
    username: `e2e_user_${now}`,
    email: `e2e_user_${now}@mail.com`,
    password: '123456',
  };

  function register(user) {
    cy.visit('/user/register.html');
    cy.get('#username').clear().type(user.username);
    cy.get('#password').clear().type(user.password);
    cy.get('#email').clear().type(user.email);
    cy.get('#register-form').submit();
    cy.url().should('include', '/user/login.html');
  }

  function login(user) {
    cy.intercept('POST', '/api/user/login').as('loginApi');
    cy.visit('/user/login.html');
    cy.get('#username').clear().type(user.username);
    cy.get('#password').clear().type(user.password);
    cy.get('#login-form').submit();
    cy.wait('@loginApi').its('response.statusCode').should('eq', 200);
  }

  function logout() {
    cy.request('POST', '/api/user/logout');
  }

  function pickOnlineCompanionWithService() {
    return cy.request('/api/companions').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      const online = (res.body || []).find((c) => c.onlineStatus === true);
      if (!online) return null;
      return cy.request(`/api/companions/${online.id}/service-prices`).then((spRes) => {
        const firstService = (spRes.body || [])[0];
        if (!firstService) return null;
        return {
          companion: online,
          servicePriceId: firstService.id,
        };
      });
    });
  }

  before(() => {
    register(customer);
  });

  it('nạp ví, yêu thích, booking đúng service, chat/call, report', () => {
    login(customer);

    cy.intercept('GET', '/api/wallet/me').as('walletMe');
    cy.intercept('POST', '/api/wallet/deposit').as('depositApi');
    cy.intercept('GET', '/api/wallet/transactions').as('walletTx');
    cy.visit('/user/wallet.html');
    cy.wait('@walletMe').its('response.statusCode').should('eq', 200);
    cy.get('#depositAmount').clear().type('100000');
    cy.get('#provider').select('MOMO');
    cy.get('#deposit-form').submit();
    cy.wait('@depositApi').its('response.statusCode').should('eq', 200);
    cy.get('#wallet-message').should('contain.text', 'Nạp tiền thành công');
    cy.wait('@walletTx').its('response.statusCode').should('eq', 200);

    pickOnlineCompanionWithService().then((ctx) => {
      if (!ctx) {
        cy.log('Skip booking/chat/report: chưa có companion online có service');
        return;
      }
      const { companion, servicePriceId } = ctx;

      cy.intercept('POST', `/api/favorites/${companion.id}`).as('addFavoriteApi');
      cy.visit(`/user/profile.html?id=${companion.id}`);
      cy.get('#add-favorite-btn').click();
      cy.wait('@addFavoriteApi').its('response.statusCode').should('eq', 200);
      cy.get('#profile-message').invoke('text').should('match', /yêu thích|yeu thich/i);

      cy.intercept('GET', `/api/companions/${companion.id}/service-prices`).as('servicePricesApi');
      cy.intercept('POST', '/api/bookings').as('createBookingApi');
      cy.intercept('GET', '/api/bookings/me').as('myBookingsApi');
      cy.visit(`/user/booking.html?id=${companion.id}`);
      cy.wait('@servicePricesApi').its('response.statusCode').should('eq', 200);
      cy.get('#servicePriceId option').its('length').should('be.greaterThan', 1);
      cy.get('#servicePriceId').select(String(servicePriceId));
      cy.get('#booking-service-price-hint').invoke('text').should('not.equal', '');
      cy.get('#bookingTime').type('2030-12-31T20:00');
      cy.get('#duration').clear().type('60');
      cy.get('#location').clear().type('Quan 1');
      cy.get('#note').clear().type('booking by cypress');
      cy.get('#booking-form').submit();
      cy.wait('@createBookingApi').then(({ response }) => {
        expect(response.statusCode).to.eq(200);
        expect(response.body).to.have.property('id');
        expect(response.body).to.have.property('servicePricePerHour');
      });
      cy.url().should('include', '/user/appointments.html');
      cy.wait('@myBookingsApi').its('response.statusCode').should('eq', 200);
      cy.get('#appointment-list').should('contain.text', 'PENDING');

      cy.request('/api/bookings/me').then((bookingRes) => {
        const bookings = bookingRes.body || [];
        const booking = bookings.find((b) => b.companion?.id === companion.id) || bookings[0];
        if (!booking) {
          cy.log('Skip chat/review: chưa lấy được booking');
          return;
        }

        cy.intercept('POST', `/api/chat/${booking.id}/messages`).as('sendChatApi');
        cy.intercept('GET', `/api/chat/${booking.id}/messages`).as('loadChatApi');
        cy.visit(`/user/chat.html?bookingId=${booking.id}`);
        cy.get('#chat-content').type('xin chao from user');
        cy.get('#chat-form').submit();
        cy.wait('@sendChatApi').its('response.statusCode').should('eq', 200);
        cy.wait('@loadChatApi').its('response.statusCode').should('eq', 200);
        cy.get('#chat-list').should('contain.text', 'xin chao from user');

        cy.intercept('GET', `/api/chat/${booking.id}/call`).as('callApi');
        cy.get('#call-btn').click();
        cy.wait('@callApi').its('response.statusCode').should('eq', 200);
        cy.get('#call-info').should('contain.text', 'VoIP room');

        cy.request({
          method: 'PATCH',
          url: `/api/bookings/me/${booking.id}/cancel`,
          failOnStatusCode: false,
        });
      });

      const reportedUserId = companion.user?.id;
      if (reportedUserId) {
        cy.intercept('POST', '/api/reports').as('reportApi');
        cy.visit(`/user/report.html?reportedUserId=${reportedUserId}`);
        cy.get('#reportCategory').select('LATE');
        cy.get('#reason').clear().type('Bao cao tu cypress');
        cy.get('#isEmergency').check({ force: true });
        cy.get('#report-form').submit();
        cy.wait('@reportApi').its('response.statusCode').should('eq', 200);
        cy.get('#report-message').should('contain.text', 'Gửi tố cáo thành công');
        cy.get('#report-list').find('.card').its('length').should('be.greaterThan', 0);
      }
    });

    logout();
  });
});
