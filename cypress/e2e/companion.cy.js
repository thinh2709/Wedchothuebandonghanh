describe('Companion Flow', () => {
  const now = Date.now();
  const username = `e2e_companion_${now}`;
  const email = `e2e_companion_${now}@mail.com`;
  const password = '123456';

  const registerUser = () => {
    cy.visit('/register');
    cy.get('#username').type(username);
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('#confirm-password').type(password);
    cy.get('#register-form').submit();
    cy.url().should('include', '/login');
  };

  const loginUser = () => {
    cy.visit('/login');
    cy.get('#username').clear().type(username);
    cy.get('#password').clear().type(password);
    cy.get('#login-form').submit();
    cy.url().should((url) => {
      expect(
        url.includes('/user/index.html') ||
        url.includes('/companion/dashboard.html')
      ).to.eq(true);
    });
  };

  it('registers companion and opens dashboard', () => {
    registerUser();
    loginUser();

    cy.visit('/companion/register.html');
    cy.get('#bio').type('Toi la companion test tu Cypress');
    cy.get('#hobbies').type('doc sach, xem phim');
    cy.get('#appearance').type('lich su');
    cy.get('#availability').type('toi thu 2-6');
    cy.get('#register-form').submit();

    cy.contains('Gui dang ky thanh cong');
    cy.url({ timeout: 10000 }).should('include', '/companion/dashboard.html');
    cy.contains('Khu vuc Companion');
  });

  it('updates profile and toggles online', () => {
    loginUser();
    cy.visit('/companion/dashboard.html');

    cy.get('#bio').clear().type('Cap nhat tieu su tu test');
    cy.get('#hobbies').clear().type('du lich');
    cy.get('#appearance').clear().type('than thien');
    cy.get('#availability-text').clear().type('ca ngay cuoi tuan');
    cy.get('#identity-number').clear().type('079123456789');
    cy.get('#identity-image-url').clear().type('https://example.com/cccd.jpg');
    cy.get('#portrait-image-url').clear().type('https://example.com/portrait.jpg');
    cy.get('#intro-media-urls').clear().type('https://example.com/intro1.jpg,https://example.com/intro2.mp4');
    cy.get('#skills').clear().type('tro chuyen, outing');
    cy.get('#profile-form').submit();
    cy.contains('Da cap nhat ho so companion.');

    cy.get('#online-toggle').click({ force: true });
    cy.contains('Da cap nhat trang thai online.');
  });

  it('manages availability slots', () => {
    loginUser();
    cy.visit('/companion/dashboard.html');

    cy.get('#start-time').type('2026-03-30T09:00');
    cy.get('#end-time').type('2026-03-30T11:00');
    cy.get('#note').type('slot test cypress');
    cy.get('#availability-form').submit();
    cy.contains('Da them khung gio ranh.');
    cy.get('#availability-body').should('contain.text', 'slot test cypress');

    cy.get('#availability-body button').first().click();
    cy.contains('Da xoa khung gio ranh.');
  });

  it('manages service prices', () => {
    loginUser();
    cy.visit('/companion/dashboard.html');

    cy.get('#service-name').type('Test service');
    cy.get('#service-price').type('150');
    cy.get('#service-description').type('mo ta test');
    cy.get('#service-price-form').submit();
    cy.contains('Da them bang gia dich vu.');
    cy.get('#service-price-body').should('contain.text', 'Test service');

    cy.get('#service-price-body button').first().click();
    cy.contains('Da xoa bang gia.');
  });

  it('loads workflow, consultations and income widgets', () => {
    loginUser();
    cy.visit('/companion/dashboard.html');

    cy.get('#wf-pending').should('exist');
    cy.get('#wf-upcoming').should('exist');
    cy.get('#wf-running').should('exist');
    cy.get('#wf-done').should('exist');
    cy.get('#consultation-body').should('exist');
    cy.get('#stat-income').should('exist');
    cy.get('#stat-available').should('exist');
    cy.get('#stat-hold').should('exist');
  });

  it('creates withdrawal request (or shows insufficient balance)', () => {
    loginUser();
    cy.visit('/companion/dashboard.html');

    cy.get('#withdraw-amount').type('1');
    cy.get('#bank-name').type('VCB');
    cy.get('#bank-account-number').type('123456789');
    cy.get('#account-holder-name').type('E2E TEST');
    cy.get('#withdraw-form').submit();

    cy.get('#alert-box .alert').invoke('text').then((text) => {
      const normalized = text.toLowerCase();
      expect(
        normalized.includes('da tao lenh rut tien') ||
        normalized.includes('insufficient available balance') ||
        normalized.includes('khong the rut tien')
      ).to.eq(true);
    });
  });
});
