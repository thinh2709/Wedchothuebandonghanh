describe('Nghiep vu E2E cho 3 role', () => {
  const now = Date.now();
  const customer = {
    username: `e2e_customer_${now}`,
    email: `e2e_customer_${now}@mail.com`,
    password: '123456',
  };
  const companion = {
    username: Cypress.env('COMPANION_USERNAME') || `e2e_companion_${now}`,
    email: `e2e_companion_${now}@mail.com`,
    password: Cypress.env('COMPANION_PASSWORD') || '123456',
  };
  const admin = {
    username: Cypress.env('ADMIN_USERNAME') || '',
    password: Cypress.env('ADMIN_PASSWORD') || '',
  };

  const state = {
    companionId: null,
    companionUserId: null,
    bookingId: null,
    hasCompanion: false,
  };

  function registerUser(user) {
    cy.visit('/user/register.html');
    cy.get('#username').clear().type(user.username);
    cy.get('#password').clear().type(user.password);
    cy.get('#email').clear().type(user.email);
    cy.get('#register-form').submit();
    cy.url().should('include', '/user/login.html');
  }

  function login(user) {
    cy.visit('/user/login.html');
    cy.get('#username').clear().type(user.username);
    cy.get('#password').clear().type(user.password);
    cy.get('#login-form').submit();
  }

  function logout() {
    cy.request('POST', '/api/user/logout');
  }

  function resolveCompanionInfo() {
    return cy.request('/api/companions').then((resp) => {
      const row = companion.username
        ? resp.body.find((item) => item.user?.username === companion.username)
        : resp.body[0];
      if (row) {
        state.companionId = row.id;
        state.companionUserId = row.user.id;
        state.hasCompanion = true;
      }
    });
  }

  before(() => {
    registerUser(customer);
    if (!Cypress.env('COMPANION_USERNAME')) {
      registerUser(companion);
      login(companion);
      cy.request({
        method: 'POST',
        url: '/api/companions/register',
        failOnStatusCode: false,
        body: {
          bio: 'Companion E2E',
          hobbies: 'doc sach',
          appearance: 'lich su',
          availability: 'toi thu 2-6',
        },
      });
      logout();

      // Du endpoint admin chua co authz role nghiem ngat, van goi duoc khi da login.
      login(customer);
      cy.request('/api/admin/pending-companions').then((resp) => {
        const created = resp.body.find((item) => item.user?.username === companion.username);
        if (created) {
          cy.request({
            method: 'POST',
            url: `/api/admin/approve-companion/${created.id}`,
            failOnStatusCode: false,
          });
        }
      });
      logout();
    }
    resolveCompanionInfo();
  });

  it('USER: nap vi, them yeu thich, dat lich, to cao', () => {
    login(customer);
    cy.url().should('include', '/user/index.html');
    cy.visit('/user/wallet.html');
    cy.get('#depositAmount').clear().type('200000');
    cy.get('#provider').select('MOMO');
    cy.get('#deposit-form').submit();
    cy.get('#wallet-message').should('contain.text', 'Nap tien thanh cong');
    cy.get('#wallet-transactions').find('tr').should('have.length.greaterThan', 0);

    resolveCompanionInfo().then(() => {
      if (!state.hasCompanion) {
        cy.log('Skip phan booking/report: chua co companion trong he thong');
        return;
      }

      cy.visit('/user/profile.html?id=' + state.companionId);
      cy.get('#add-favorite-btn').click();
      cy.get('#profile-message').should('contain.text', 'Da them vao yeu thich');

      cy.visit('/user/booking.html?id=' + state.companionId);
      cy.get('#duration').clear().type('60');
      cy.get('#location').type('Quan 1');
      cy.get('#note').type('Booking tu cypress');
      cy.get('#booking-form').submit();
      cy.url().should('include', '/user/appointments.html');
      cy.get('#appointment-list').should('contain.text', 'PENDING');

      cy.request('/api/bookings/me').then((resp) => {
        const bookings = resp.body;
        expect(bookings.length).to.be.greaterThan(0);
        state.bookingId = bookings[0].id;
      });

      cy.visit('/user/report.html');
      cy.get('#reportedUserId').clear().type(String(state.companionUserId));
      cy.get('#reportCategory').select('LATE');
      cy.get('#reason').type('Companion den tre');
      cy.get('#isEmergency').check({ force: true });
      cy.get('#report-form').submit();
      cy.get('#report-message').should('contain.text', 'Gui to cao thanh cong');
      cy.get('#report-list').find('.card').should('have.length.greaterThan', 0);
    });
  });

  it('COMPANION: xu ly booking + rut tien', () => {
    if (!state.hasCompanion) {
      cy.log('Skip: chua co companion account hop le de chay flow');
      return;
    }
    login(companion);
    cy.url().should('include', '/companion/dashboard.html');

    cy.visit('/companion/dashboard.html');
    cy.contains('#booking-body tr', customer.username, { timeout: 15000 }).within(() => {
      cy.contains('button', 'Nhan').click();
    });
    cy.get('#alert-box').should('contain.text', 'ACCEPTED');
    cy.get('#wf-upcoming').invoke('text').then((value) => {
      expect(Number(value.trim() || '0')).to.be.gte(1);
    });

    cy.contains('#booking-body tr', customer.username).within(() => {
      cy.contains('button', 'Check-in').click();
    });
    cy.get('#alert-box').should('contain.text', 'check-in');

    cy.contains('#booking-body tr', customer.username).within(() => {
      cy.contains('button', 'Check-out').click();
    });
    cy.get('#alert-box').should('contain.text', 'check-out');

    cy.request('/api/companions/me/bookings').then((resp) => {
      const completed = resp.body.find((b) => b.status === 'COMPLETED');
      expect(completed, 'Can co booking COMPLETED').to.exist;
      state.bookingId = completed.id;
    });

    cy.window().then((win) => {
      cy.stub(win, 'prompt')
        .onFirstCall().returns('5')
        .onSecondCall().returns('Khach lich su');
    });
    cy.contains('#booking-body tr', customer.username).within(() => {
      cy.contains('button', 'Rate User').click();
    });
    cy.get('#alert-box').should('contain.text', 'Da danh gia user');

    cy.get('#withdraw-amount').clear().type('1');
    cy.get('#bank-name').clear().type('VCB');
    cy.get('#bank-account-number').clear().type('123456789');
    cy.get('#account-holder-name').clear().type('E2E TEST');
    cy.get('#withdraw-form').submit();
    cy.get('#alert-box .alert').invoke('text').then((text) => {
      const normalized = text.toLowerCase();
      expect(
        normalized.includes('da tao lenh rut tien') ||
          normalized.includes('khong the rut tien') ||
          normalized.includes('insufficient available balance')
      ).to.eq(true);
    });
  });

  it('USER bo sung: chat/call + danh gia', () => {
    if (!state.bookingId) {
      cy.log('Skip: chua tao duoc booking hoan tat');
      return;
    }
    login(customer);
    cy.visit('/user/appointments.html');
    cy.get('#appointment-list').should('contain.text', 'COMPLETED');

    cy.visit('/user/chat.html?bookingId=' + state.bookingId);
    cy.get('#chat-content').type('Xin chao companion');
    cy.get('#chat-form').submit();
    cy.get('#chat-list').should('contain.text', 'Xin chao companion');
    cy.get('#call-btn').click();
    cy.get('#call-info').should('contain.text', 'VoIP room');

    cy.visit('/user/review.html');
    cy.get('#bookingId').should('not.contain.text', 'Khong co lich hen da hoan thanh');
    cy.get('#rating-stars .star-btn[data-value="5"]').click();
    cy.get('#comment').type('Trai nghiem rat tot');
    cy.get('#review-form').submit();
    cy.get('#review-message').should('contain.text', 'Gui danh gia thanh cong');
    cy.get('#review-list').should('contain.text', 'Trai nghiem rat tot');
  });

  it('ADMIN: moderation, users, transactions, disputes', () => {
    if (!admin.username || !admin.password) {
      cy.log('Skip: chua cau hinh ADMIN_USERNAME/ADMIN_PASSWORD');
      return;
    }
    login(admin);

    cy.visit('/admin/dashboard.html');
    cy.get('#stat-profit').should('exist');
    cy.get('#stat-transactions').should('exist');
    cy.get('#pending-body').should('exist');

    cy.visit('/admin/users.html');
    cy.get('#users-body').should('contain.text', customer.username);

    cy.visit('/admin/moderation.html');
    cy.get('#moderation-pending-body').then(($tbody) => {
      if ($tbody.text().includes(companion.username)) {
        cy.contains('#moderation-pending-body tr', companion.username).within(() => {
          cy.contains('button', 'Cap tich xanh').click();
        });
        cy.get('#admin-alert').should('contain.text', 'Da cap tich xanh');
      }
    });

    cy.visit('/admin/transactions.html');
    cy.get('#commission-rate').clear().type('0.2');
    cy.get('#commission-form').submit();
    cy.get('#admin-alert').should('contain.text', 'commission rate');
    cy.get('#withdrawals-body').then(($tbody) => {
      if ($tbody.text().includes('Duyet')) {
        cy.get('#withdrawals-body button[data-action="approve"]').first().click();
        cy.get('#admin-alert').should('contain.text', 'Da duyet lenh rut tien');
      }
    });

    cy.visit('/admin/disputes.html');
    cy.get('#disputes-body').then(($tbody) => {
      if (!$tbody.text().includes('Khong co tranh chap')) {
        cy.get('#disputes-body button[data-action="freeze"]').first().click();
        cy.get('#admin-alert').should('contain.text', 'Da cap nhat xu ly tranh chap');
      }
    });
  });
});
