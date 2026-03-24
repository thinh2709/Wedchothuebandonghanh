describe('Dòng tiền E2E: nạp ví, giữ tiền, thanh toán, thu nhập companion, rút tiền', () => {
  const now = Date.now();
  const customer = {
    username: `mf_cust_${now}`,
    email: `mf_cust_${now}@mail.com`,
    password: '123456',
  };
  const companionUser = {
    username: `mf_comp_${now}`,
    email: `mf_comp_${now}@mail.com`,
    password: '123456',
  };
  const admin = {
    username: Cypress.env('ADMIN_USERNAME') || 'thinh270924@gmail.com',
    password: Cypress.env('ADMIN_PASSWORD') || '123456',
  };

  const state = {
    companionId: null,
    bookingId: null,
    holdAmount: 0,
    withdrawalId: null,
  };

  const DEPOSIT_AMOUNT = 500000;
  const BOOKING_DURATION = 60;
  const EXPECTED_HOLD = 200000;

  function apiRegister(user) {
    return cy.request({
      method: 'POST',
      url: '/api/user/register',
      body: { username: user.username, password: user.password, email: user.email },
      failOnStatusCode: false,
    });
  }

  function apiLogin(user) {
    return cy.request({
      method: 'POST',
      url: '/api/user/login',
      body: { username: user.username, password: user.password },
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.success).to.eq(true);
    });
  }

  function apiLogout() {
    return cy.request('POST', '/api/user/logout');
  }

  before(() => {
    apiRegister(customer);
    apiRegister(companionUser);

    apiLogin(companionUser);
    cy.request({
      method: 'POST',
      url: '/api/companions/register',
      failOnStatusCode: false,
      body: {
        bio: 'Money flow companion',
        hobbies: 'test',
        appearance: 'test',
        availability: 'luon san',
      },
    });
    apiLogout();

    apiLogin(admin);
    cy.request('/api/admin/pending-companions').then((resp) => {
      const found = resp.body.find((c) => c.user?.username === companionUser.username);
      if (found) {
        state.companionId = found.id;
        cy.request({
          method: 'POST',
          url: `/api/admin/approve-companion/${found.id}`,
          failOnStatusCode: false,
        });
      }
    });
    apiLogout();

    cy.request('/api/companions').then((resp) => {
      const found = resp.body.find((c) => c.user?.username === companionUser.username);
      if (found) {
        state.companionId = found.id;
      }
    });
  });

  it('1. Nạp tiền → balance tăng đúng, có DEPOSIT trong lịch sử', () => {
    apiLogin(customer);

    cy.request('/api/wallet/me').then((resp) => {
      expect(resp.status).to.eq(200);
      expect(Number(resp.body.balance)).to.eq(0, 'Balance ban đầu phải = 0');
    });

    cy.request({
      method: 'POST',
      url: '/api/wallet/deposit',
      body: { amount: DEPOSIT_AMOUNT, provider: 'MOMO' },
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(Number(resp.body.balance)).to.eq(DEPOSIT_AMOUNT);
      expect(resp.body.message).to.contain('Nạp tiền thành công');
    });

    cy.request('/api/wallet/me').then((resp) => {
      expect(Number(resp.body.balance)).to.eq(DEPOSIT_AMOUNT, 'Balance sau nạp phải = DEPOSIT_AMOUNT');
    });

    cy.request('/api/wallet/transactions').then((resp) => {
      expect(resp.body.length).to.be.greaterThan(0);
      const depositTx = resp.body.find((tx) => tx.type === 'DEPOSIT');
      expect(depositTx, 'Phải có giao dịch DEPOSIT').to.exist;
      expect(Number(depositTx.amount)).to.eq(DEPOSIT_AMOUNT);
      expect(depositTx.provider).to.eq('MOMO');
    });

    apiLogout();
  });

  it('2. Đặt booking (PENDING) → balance chưa bị trừ', () => {
    apiLogin(customer);

    const bookingTime = new Date(Date.now() + 86400000).toISOString().slice(0, 19);

    cy.request({
      method: 'POST',
      url: '/api/bookings',
      body: {
        companionId: state.companionId,
        bookingTime,
        duration: BOOKING_DURATION,
        location: 'Money test Quan 1',
        note: 'Money flow test booking',
      },
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      state.bookingId = resp.body.id;
      state.holdAmount = Number(resp.body.holdAmount);
      expect(resp.body.status).to.eq('PENDING');
      expect(state.holdAmount).to.eq(EXPECTED_HOLD, `holdAmount phải = ${EXPECTED_HOLD} (pricePerHour 200000 x 1h)`);
    });

    cy.request('/api/wallet/me').then((resp) => {
      expect(Number(resp.body.balance)).to.eq(
        DEPOSIT_AMOUNT,
        'Khi booking PENDING, balance chưa bị trừ'
      );
    });

    apiLogout();
  });

  it('3. Companion chấp nhận → user bị trừ holdAmount, có HOLD tx', () => {
    apiLogin(companionUser);

    cy.request({
      method: 'PATCH',
      url: `/api/companions/me/bookings/${state.bookingId}`,
      body: { status: 'ACCEPTED' },
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.status).to.eq('ACCEPTED');
    });

    apiLogout();

    apiLogin(customer);

    cy.request('/api/wallet/me').then((resp) => {
      const expectedBalance = DEPOSIT_AMOUNT - EXPECTED_HOLD;
      expect(Number(resp.body.balance)).to.eq(
        expectedBalance,
        `Balance sau HOLD phải = ${expectedBalance}`
      );
    });

    cy.request('/api/wallet/transactions').then((resp) => {
      const holdTx = resp.body.find((tx) => tx.type === 'HOLD');
      expect(holdTx, 'Phải có giao dịch HOLD').to.exist;
      expect(Number(holdTx.amount)).to.eq(-EXPECTED_HOLD, 'HOLD amount phải là số âm');
    });

    apiLogout();
  });

  it('4. Check-in → Check-out: hoàn tất booking, tạo CHARGE + Transaction', () => {
    apiLogin(companionUser);
    cy.request({
      method: 'POST',
      url: `/api/companions/me/bookings/${state.bookingId}/checkin`,
      body: { lat: '10.762622', lng: '106.660172' },
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.status).to.eq('IN_PROGRESS');
    });
    apiLogout();

    apiLogin(customer);
    cy.request({
      method: 'PATCH',
      url: `/api/bookings/me/${state.bookingId}/check-out`,
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.status).to.eq('COMPLETED');
    });

    cy.request('/api/wallet/me').then((resp) => {
      const expectedBalance = DEPOSIT_AMOUNT - EXPECTED_HOLD;
      expect(Number(resp.body.balance)).to.eq(
        expectedBalance,
        'Balance không đổi sau check-out (tiền đã bị giữ từ trước)'
      );
    });

    cy.request('/api/wallet/transactions').then((resp) => {
      const chargeTx = resp.body.find((tx) => tx.type === 'CHARGE');
      expect(chargeTx, 'Phải có giao dịch CHARGE sau check-out').to.exist;
      expect(Number(chargeTx.amount)).to.eq(-EXPECTED_HOLD, 'CHARGE = -holdAmount');

      const types = resp.body.map((tx) => tx.type);
      expect(types).to.include('DEPOSIT');
      expect(types).to.include('HOLD');
      expect(types).to.include('CHARGE');
    });

    apiLogout();
  });

  it('5. Companion kiểm tra thu nhập → totalIncome = holdAmount', () => {
    apiLogin(companionUser);

    cy.request('/api/companions/me/income-stats').then((resp) => {
      expect(resp.status).to.eq(200);
      expect(Number(resp.body.totalIncome)).to.eq(
        EXPECTED_HOLD,
        `Thu nhập companion phải = ${EXPECTED_HOLD}`
      );
      expect(Number(resp.body.availableBalance)).to.eq(
        EXPECTED_HOLD,
        `Số dư khả dụng phải = ${EXPECTED_HOLD}`
      );
      expect(Number(resp.body.completedBookings)).to.be.gte(1);
    });

    apiLogout();
  });

  it('6. Companion rút tiền thành công → tạo lệnh PENDING', () => {
    apiLogin(companionUser);

    cy.request({
      method: 'POST',
      url: '/api/companions/me/withdrawals',
      body: {
        amount: String(EXPECTED_HOLD),
        bankName: 'Vietcombank',
        bankAccountNumber: '9876543210',
        accountHolderName: 'NGUYEN VAN TEST',
      },
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.status).to.eq('PENDING');
      expect(Number(resp.body.amount)).to.eq(EXPECTED_HOLD);
      expect(resp.body.bankName).to.eq('Vietcombank');
      state.withdrawalId = resp.body.id;
    });

    cy.request('/api/companions/me/income-stats').then((resp) => {
      expect(Number(resp.body.availableBalance)).to.eq(
        0,
        'Sau khi rút hết, available balance = 0'
      );
    });

    cy.request('/api/companions/me/withdrawals').then((resp) => {
      const wd = resp.body.find((w) => w.id === state.withdrawalId);
      expect(wd, 'Withdrawal phải nằm trong danh sách').to.exist;
      expect(wd.status).to.eq('PENDING');
    });

    apiLogout();
  });

  it('7. Companion rút vượt số dư → bị từ chối (400)', () => {
    apiLogin(companionUser);

    cy.request({
      method: 'POST',
      url: '/api/companions/me/withdrawals',
      body: {
        amount: '999999999',
        bankName: 'VCB',
        bankAccountNumber: '1111222233',
        accountHolderName: 'TEST',
      },
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(400, 'Rút vượt số dư phải trả 400');
    });

    apiLogout();
  });

  it('8. Companion rút thiếu thông tin ngân hàng → bị từ chối', () => {
    apiLogin(companionUser);

    cy.request({
      method: 'POST',
      url: '/api/companions/me/withdrawals',
      body: {
        amount: '1',
        bankName: '',
        bankAccountNumber: '',
        accountHolderName: '',
      },
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(400, 'Thiếu thông tin bank phải trả 400');
    });

    apiLogout();
  });

  it('9. Admin duyệt lệnh rút tiền → trạng thái APPROVED', () => {
    apiLogin(admin);

    cy.request('/api/admin/transactions').then((resp) => {
      expect(resp.status).to.eq(200);
      const pending = resp.body.pendingWithdrawals || [];
      const wd = pending.find((w) => w.id === state.withdrawalId);
      expect(wd, 'Withdrawal phải xuất hiện trong pending list của admin').to.exist;
      expect(Number(wd.amount)).to.eq(EXPECTED_HOLD);
    });

    cy.request({
      method: 'POST',
      url: `/api/admin/transactions/withdrawals/${state.withdrawalId}/approve`,
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.status).to.eq('APPROVED');
      expect(resp.body.message).to.contain('Da duyet lenh rut tien');
    });

    apiLogout();

    apiLogin(companionUser);
    cy.request('/api/companions/me/withdrawals').then((resp) => {
      const wd = resp.body.find((w) => w.id === state.withdrawalId);
      expect(wd, 'Withdrawal phải tồn tại').to.exist;
      expect(wd.status).to.eq('APPROVED', 'Status phải là APPROVED sau khi admin duyệt');
    });
    apiLogout();
  });

  it('10. Nạp thêm → đặt booking 2 → hủy khi PENDING → balance không đổi', () => {
    apiLogin(customer);

    cy.request({
      method: 'POST',
      url: '/api/wallet/deposit',
      body: { amount: 300000, provider: 'BANK' },
    });

    cy.request('/api/wallet/me').then((resp) => {
      const balanceBefore = Number(resp.body.balance);

      const bookingTime = new Date(Date.now() + 172800000).toISOString().slice(0, 19);
      cy.request({
        method: 'POST',
        url: '/api/bookings',
        body: {
          companionId: state.companionId,
          bookingTime,
          duration: 60,
          location: 'Test cancel',
          note: 'cancel test',
        },
      }).then((bResp) => {
        const newBookingId = bResp.body.id;
        expect(bResp.body.status).to.eq('PENDING');

        cy.request({
          method: 'PATCH',
          url: `/api/bookings/me/${newBookingId}/cancel`,
        }).then((cResp) => {
          expect(cResp.status).to.eq(200);
          expect(cResp.body.status).to.eq('CANCELLED');
        });

        cy.request('/api/wallet/me').then((wResp) => {
          expect(Number(wResp.body.balance)).to.eq(
            balanceBefore,
            'Hủy khi PENDING → balance không đổi (chưa hold)'
          );
        });
      });
    });

    apiLogout();
  });

  it('11. Đặt booking → companion accept → hủy → kiểm tra hoàn tiền theo chính sách', () => {
    apiLogin(customer);

    cy.request('/api/wallet/me').then((wBefore) => {
      const balanceBefore = Number(wBefore.body.balance);

      const farFuture = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 19);
      cy.request({
        method: 'POST',
        url: '/api/bookings',
        body: {
          companionId: state.companionId,
          bookingTime: farFuture,
          duration: 60,
          location: 'Refund test',
          note: 'refund policy test',
        },
      }).then((bResp) => {
        const refundBookingId = bResp.body.id;
        const refundHold = Number(bResp.body.holdAmount);
        apiLogout();

        apiLogin(companionUser);
        cy.request({
          method: 'PATCH',
          url: `/api/companions/me/bookings/${refundBookingId}`,
          body: { status: 'ACCEPTED' },
        }).then((aResp) => {
          expect(aResp.body.status).to.eq('ACCEPTED');
        });
        apiLogout();

        apiLogin(customer);
        cy.request('/api/wallet/me').then((wAfterHold) => {
          const balanceAfterHold = Number(wAfterHold.body.balance);
          expect(balanceAfterHold).to.eq(
            balanceBefore - refundHold,
            'Balance giảm đúng holdAmount sau khi companion accept'
          );

          cy.request({
            method: 'PATCH',
            url: `/api/bookings/me/${refundBookingId}/cancel`,
          }).then((cResp) => {
            expect(cResp.body.status).to.eq('CANCELLED');
          });

          cy.request('/api/wallet/me').then((wAfterCancel) => {
            const balanceAfterCancel = Number(wAfterCancel.body.balance);
            expect(balanceAfterCancel).to.be.gte(
              balanceAfterHold,
              'Sau khi hủy booking ACCEPTED, balance phải >= balance lúc hold (có hoàn tiền)'
            );
            const refunded = balanceAfterCancel - balanceAfterHold;
            cy.log(`Hoàn tiền: ${refunded} / ${refundHold} (bookingTime > 24h → 100%)`);
            expect(refunded).to.eq(refundHold, 'Hủy trước >24h → hoàn 100%');
          });

          cy.request('/api/wallet/transactions').then((txResp) => {
            const refundTx = txResp.body.find(
              (tx) => tx.type === 'REFUND' && tx.booking?.id === refundBookingId
            );
            expect(refundTx, 'Phải có giao dịch REFUND').to.exist;
            expect(Number(refundTx.amount)).to.eq(refundHold);
          });
        });
      });
    });

    apiLogout();
  });

  it('12. UI: kiểm tra trang ví hiển thị đúng balance và lịch sử giao dịch', () => {
    apiLogin(customer);

    cy.intercept('GET', '/api/wallet/me').as('walletMe');
    cy.intercept('GET', '/api/wallet/transactions').as('walletTx');
    cy.visit('/user/wallet.html');
    cy.wait('@walletMe');
    cy.wait('@walletTx');

    cy.get('#wallet-balance', { timeout: 10000 }).should('not.have.text', '0 VND');
    cy.get('#wallet-balance').invoke('text').then((text) => {
      const displayed = text.replace(/[^0-9]/g, '');
      expect(Number(displayed)).to.be.greaterThan(0, 'Balance hiển thị trên UI > 0');
    });

    cy.get('#wallet-transactions').should('exist');
    cy.get('#wallet-transactions').find('tr').should('have.length.greaterThan', 2);

    apiLogout();
  });

  it('13. UI: companion xem finance → thu nhập và lệnh rút hiển thị', () => {
    apiLogin(companionUser);

    cy.intercept('GET', '/api/companions/me/income-stats').as('incomeStats');
    cy.intercept('GET', '/api/companions/me/withdrawals').as('withdrawalsList');
    cy.visit('/companion/finance.html');
    cy.wait('@incomeStats');
    cy.wait('@withdrawalsList');

    cy.get('#stat-income', { timeout: 10000 }).should('not.have.text', '0');
    cy.get('#stat-income').invoke('text').then((text) => {
      const income = Number(text.replace(/[^0-9]/g, ''));
      expect(income).to.be.greaterThan(0, 'Thu nhập hiển thị trên UI > 0');
    });

    cy.get('#withdrawal-body').should('exist');
    cy.get('#withdrawal-body').find('tr').should('have.length.greaterThan', 0);

    apiLogout();
  });
});
