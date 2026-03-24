async function getJson(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
        const text = await res.text();
        let message = text;
        try {
            const json = JSON.parse(text);
            message = json.message || text;
        } catch (_) {}
        throw new Error(message);
    }
    if (res.status === 204) {
        return null;
    }
    return res.json();
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function showAlert(message, type = 'success') {
    const box = document.getElementById('alert-box');
    box.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${escapeHtml(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

function statusBadgeClass(status) {
    if (status === 'APPROVED') {
        return 'text-bg-success';
    }
    if (status === 'PENDING') {
        return 'text-bg-warning';
    }
    if (status === 'REJECTED') {
        return 'text-bg-danger';
    }
    return 'text-bg-secondary';
}

function fmtDateTime(value) {
    if (!value) {
        return '';
    }
    return new Date(value).toLocaleString('vi-VN');
}

async function sendJson(url, method, payload) {
    return getJson(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}

function getCurrentLocation() {
    return new Promise(resolve => {
        if (!navigator.geolocation) {
            resolve({ lat: null, lng: null });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => resolve({ lat: null, lng: null }),
            { enableHighAccuracy: false, timeout: 4000 }
        );
    });
}

async function loadProfile() {
    try {
        const profile = await getJson('/api/companions/me/profile');
        document.getElementById('bio').value = profile.bio || '';
        document.getElementById('hobbies').value = profile.hobbies || '';
        document.getElementById('appearance').value = profile.appearance || '';
        document.getElementById('availability-text').value = profile.availability || '';
        document.getElementById('identity-number').value = profile.identityNumber || '';
        document.getElementById('identity-image-url').value = profile.identityImageUrl || '';
        document.getElementById('portrait-image-url').value = profile.portraitImageUrl || '';
        document.getElementById('intro-media-urls').value = profile.introMediaUrls || '';
        document.getElementById('skills').value = profile.skills || '';
        document.getElementById('online-toggle').checked = !!profile.online;
        const statusEl = document.getElementById('companion-status');
        statusEl.className = `badge ${statusBadgeClass(profile.status)}`;
        statusEl.textContent = profile.status || 'N/A';
    } catch (_) {
        document.getElementById('bio').value = '';
        document.getElementById('hobbies').value = '';
        document.getElementById('appearance').value = '';
        document.getElementById('availability-text').value = '';
        const statusEl = document.getElementById('companion-status');
        statusEl.className = 'badge text-bg-secondary';
        statusEl.textContent = 'N/A';
    }
}

async function saveProfile(e) {
    e.preventDefault();
    const payload = {
        bio: document.getElementById('bio').value.trim(),
        hobbies: document.getElementById('hobbies').value.trim(),
        appearance: document.getElementById('appearance').value.trim(),
        availability: document.getElementById('availability-text').value.trim()
    };
    await sendJson('/api/companions/me/profile', 'PUT', payload);
    await sendJson('/api/companions/me/identity', 'PUT', {
        identityNumber: document.getElementById('identity-number').value.trim(),
        identityImageUrl: document.getElementById('identity-image-url').value.trim(),
        portraitImageUrl: document.getElementById('portrait-image-url').value.trim()
    });
    await sendJson('/api/companions/me/media-skills', 'PUT', {
        introMediaUrls: document.getElementById('intro-media-urls').value.trim(),
        skills: document.getElementById('skills').value.trim()
    });
    showAlert('Đã cập nhật hồ sơ companion.');
    await loadProfile();
}

async function updateOnlineStatus() {
    await sendJson('/api/companions/me/online', 'PATCH', {
        online: document.getElementById('online-toggle').checked
    });
    showAlert('Đã cập nhật trạng thái online.');
}

async function loadAvailabilities() {
    const rows = document.getElementById('availability-body');
    const data = await getJson('/api/companions/me/availabilities');
    rows.innerHTML = '';
    if (!data.length) {
        rows.innerHTML = '<tr><td colspan="4" class="text-muted">Chưa có khung giờ rảnh.</td></tr>';
        return;
    }
    data.forEach(slot => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(fmtDateTime(slot.startTime))}</td>
            <td>${escapeHtml(fmtDateTime(slot.endTime))}</td>
            <td>${escapeHtml(slot.note || '')}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-danger" data-id="${slot.id}">Xóa</button>
            </td>`;
        tr.querySelector('button').addEventListener('click', async () => {
            try {
                await fetch(`/api/companions/me/availabilities/${slot.id}`, { method: 'DELETE' });
                await loadAvailabilities();
                showAlert('Đã xóa khung giờ rảnh.');
            } catch (err) {
                showAlert(`Không thể xóa: ${err.message}`, 'danger');
            }
        });
        rows.appendChild(tr);
    });
}

async function addAvailability(e) {
    e.preventDefault();
    const payload = {
        startTime: document.getElementById('start-time').value,
        endTime: document.getElementById('end-time').value,
        note: document.getElementById('note').value.trim()
    };
    await sendJson('/api/companions/me/availabilities', 'POST', payload);
    e.target.reset();
    await loadAvailabilities();
    showAlert('Đã thêm khung giờ rảnh.');
}

async function updateBookingStatus(bookingId, status) {
    await sendJson(`/api/companions/me/bookings/${bookingId}`, 'PATCH', { status });
    await loadBookings();
    await loadBookingWorkflow();
    await loadIncomeStats();
    showAlert(`Đã cập nhật booking #${bookingId} -> ${status}.`);
}

async function checkInBooking(bookingId) {
    const loc = await getCurrentLocation();
    await sendJson(`/api/companions/me/bookings/${bookingId}/checkin`, 'POST', {
        lat: loc.lat,
        lng: loc.lng
    });
    await loadBookings();
    await loadBookingWorkflow();
    showAlert(`Đã check-in booking #${bookingId}.`);
}

async function checkOutBooking(bookingId) {
    const loc = await getCurrentLocation();
    await sendJson(`/api/companions/me/bookings/${bookingId}/checkout`, 'POST', {
        lat: loc.lat,
        lng: loc.lng
    });
    await loadBookings();
    await loadBookingWorkflow();
    await loadIncomeStats();
    showAlert(`Đã check-out booking #${bookingId}.`);
}

async function sendSos(bookingId) {
    const note = prompt('Nhập nội dung khẩn cấp (SOS):');
    if (!note) {
        return;
    }
    const loc = await getCurrentLocation();
    await sendJson(`/api/companions/me/bookings/${bookingId}/sos`, 'POST', {
        note,
        lat: loc.lat,
        lng: loc.lng
    });
    showAlert(`Đã gửi SOS cho booking #${bookingId}.`, 'warning');
}

async function rateUser(bookingId) {
    const rating = prompt('Đánh giá user (1-5):');
    if (!rating) {
        return;
    }
    const review = prompt('Nhận xét ngắn về user:') || '';
    await sendJson(`/api/companions/me/bookings/${bookingId}/rate-user`, 'POST', {
        rating,
        review
    });
    await loadBookings();
    showAlert(`Đã đánh giá user cho booking #${bookingId}.`);
}

async function loadBookings() {
    const rows = document.getElementById('booking-body');
    const bookings = await getJson('/api/companions/me/bookings');
    rows.innerHTML = '';
    if (!bookings.length) {
        rows.innerHTML = '<tr><td colspan="6" class="text-muted">Chưa có booking.</td></tr>';
        return;
    }
    bookings.forEach(item => {
        const tr = document.createElement('tr');
        const canProcess = item.status === 'PENDING';
        const canCheckIn = item.status === 'ACCEPTED';
        const canCheckOut = item.status === 'IN_PROGRESS';
        const canRateUser = item.status === 'COMPLETED' && !item.companionRatingForUser;
        const canChat = item.status === 'ACCEPTED' || item.status === 'IN_PROGRESS' || item.status === 'COMPLETED';
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${escapeHtml(item.customer?.fullName || item.customer?.username || '')}</td>
            <td>${escapeHtml(fmtDateTime(item.bookingTime))}</td>
            <td>${item.duration} phút</td>
            <td><span class="badge text-bg-secondary">${escapeHtml(item.status)}</span></td>
            <td class="text-end">
                ${canProcess ? `<button class="btn btn-sm btn-success me-2" data-action="accept">Nhận</button>
                <button class="btn btn-sm btn-danger" data-action="reject">Từ chối</button>` : ''}
                ${canCheckIn ? `<button class="btn btn-sm btn-outline-primary me-2" data-action="checkin">Check-in</button>` : ''}
                ${canCheckOut ? `<button class="btn btn-sm btn-outline-success me-2" data-action="checkout">Check-out</button>` : ''}
                ${canRateUser ? `<button class="btn btn-sm btn-outline-secondary me-2" data-action="rate">Rate User</button>` : ''}
                ${canChat ? `<a class="btn btn-sm btn-outline-dark me-2" href="/user/chat.html?bookingId=${item.id}">Chat/Call</a>` : ''}
                <button class="btn btn-sm btn-outline-danger" data-action="sos">SOS</button>
            </td>`;
        if (canProcess) {
            tr.querySelector('[data-action="accept"]').addEventListener('click', () => updateBookingStatus(item.id, 'ACCEPTED'));
            tr.querySelector('[data-action="reject"]').addEventListener('click', () => updateBookingStatus(item.id, 'REJECTED'));
        }
        if (canCheckIn) {
            tr.querySelector('[data-action="checkin"]').addEventListener('click', () => checkInBooking(item.id));
        }
        if (canCheckOut) {
            tr.querySelector('[data-action="checkout"]').addEventListener('click', () => checkOutBooking(item.id));
        }
        if (canRateUser) {
            tr.querySelector('[data-action="rate"]').addEventListener('click', () => rateUser(item.id));
        }
        tr.querySelector('[data-action="sos"]').addEventListener('click', () => sendSos(item.id));
        rows.appendChild(tr);
    });
}

async function loadBookingWorkflow() {
    const wf = await getJson('/api/companions/me/bookings/workflow');
    document.getElementById('wf-pending').textContent = (wf.pending || []).length;
    document.getElementById('wf-upcoming').textContent = (wf.upcoming || []).length;
    document.getElementById('wf-running').textContent = (wf.running || []).length;
    document.getElementById('wf-done').textContent = (wf.done || []).length;
}

async function answerConsultation(id, answer) {
    await sendJson(`/api/companions/me/consultations/${id}/answer`, 'PATCH', { answer });
    await loadConsultations();
    showAlert(`Đã trả lời tư vấn #${id}.`);
}

async function loadConsultations() {
    const rows = document.getElementById('consultation-body');
    const list = await getJson('/api/companions/me/consultations');
    rows.innerHTML = '';
    if (!list.length) {
        rows.innerHTML = '<tr><td colspan="5" class="text-muted">Chưa có câu hỏi tư vấn.</td></tr>';
        return;
    }
    list.forEach(item => {
        const tr = document.createElement('tr');
        const canAnswer = item.status === 'PENDING';
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${escapeHtml(item.customer?.fullName || item.customer?.username || '')}</td>
            <td>${escapeHtml(item.question || '')}</td>
            <td>
                ${canAnswer
                    ? `<div class="input-group input-group-sm">
                        <input class="form-control" placeholder="Nhập câu trả lời">
                        <button class="btn btn-primary">Gửi</button>
                    </div>`
                    : `<span>${escapeHtml(item.answer || '')}</span>`}
            </td>
            <td><span class="badge text-bg-secondary">${escapeHtml(item.status)}</span></td>`;
        if (canAnswer) {
            const input = tr.querySelector('input');
            tr.querySelector('button').addEventListener('click', async () => {
                const answer = input.value.trim();
                if (!answer) {
                    showAlert('Vui lòng nhập câu trả lời.', 'warning');
                    return;
                }
                await answerConsultation(item.id, answer);
            });
        }
        rows.appendChild(tr);
    });
}

async function loadIncomeStats() {
    const stats = await getJson('/api/companions/me/income-stats');
    document.getElementById('stat-income').textContent = Number(stats.totalIncome || 0).toLocaleString('vi-VN');
    document.getElementById('stat-available').textContent = Number(stats.availableBalance || 0).toLocaleString('vi-VN');
    document.getElementById('stat-hold').textContent = Number(stats.holdAmount || 0).toLocaleString('vi-VN');
    document.getElementById('stat-accepted').textContent = stats.acceptedBookings ?? 0;
    document.getElementById('stat-completed').textContent = stats.completedBookings ?? 0;
}

async function loadServicePrices() {
    const rows = document.getElementById('service-price-body');
    const data = await getJson('/api/companions/me/service-prices');
    rows.innerHTML = '';
    if (!data.length) {
        rows.innerHTML = '<tr><td colspan="4" class="text-muted">Chưa có bảng giá.</td></tr>';
        return;
    }
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(item.serviceName || '')}</td>
            <td>${Number(item.pricePerHour || 0).toLocaleString('vi-VN')}</td>
            <td>${escapeHtml(item.description || '')}</td>
            <td class="text-end"><button class="btn btn-sm btn-outline-danger">Xóa</button></td>`;
        tr.querySelector('button').addEventListener('click', async () => {
            await fetch(`/api/companions/me/service-prices/${item.id}`, { method: 'DELETE' });
            await loadServicePrices();
            showAlert('Đã xóa bảng giá.');
        });
        rows.appendChild(tr);
    });
}

async function addServicePrice(e) {
    e.preventDefault();
    await sendJson('/api/companions/me/service-prices', 'POST', {
        serviceName: document.getElementById('service-name').value.trim(),
        pricePerHour: document.getElementById('service-price').value,
        description: document.getElementById('service-description').value.trim()
    });
    e.target.reset();
    await loadServicePrices();
    showAlert('Đã thêm bảng giá dịch vụ.');
}

async function loadWithdrawals() {
    const rows = document.getElementById('withdrawal-body');
    const data = await getJson('/api/companions/me/withdrawals');
    rows.innerHTML = '';
    if (!data.length) {
        rows.innerHTML = '<tr><td colspan="4" class="text-muted">Chưa có lệnh rút tiền.</td></tr>';
        return;
    }
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(fmtDateTime(item.createdAt))}</td>
            <td>${Number(item.amount || 0).toLocaleString('vi-VN')}</td>
            <td>${escapeHtml(item.bankName || '')}</td>
            <td><span class="badge text-bg-secondary">${escapeHtml(item.status || '')}</span></td>`;
        rows.appendChild(tr);
    });
}

async function createWithdrawal(e) {
    e.preventDefault();
    await sendJson('/api/companions/me/withdrawals', 'POST', {
        amount: document.getElementById('withdraw-amount').value,
        bankName: document.getElementById('bank-name').value.trim(),
        bankAccountNumber: document.getElementById('bank-account-number').value.trim(),
        accountHolderName: document.getElementById('account-holder-name').value.trim()
    });
    e.target.reset();
    await loadWithdrawals();
    await loadIncomeStats();
    showAlert('Đã tạo lệnh rút tiền.');
}

async function bootstrap() {
    try {
        const auth = await getJson('/api/auth/me');
        if (!auth.authenticated) {
            window.location.href = '/user/login.html';
            return;
        }
        const authUserEl = document.getElementById('auth-user');
        if (authUserEl) {
            authUserEl.textContent = `Xin chào, ${auth.username}`;
        }
        const page = document.body.dataset.page || 'companion-dashboard';

        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                try {
                    await saveProfile(e);
                } catch (err) {
                    showAlert(`Không thể cập nhật hồ sơ: ${err.message}`, 'danger');
                }
            });
        }

        const availabilityForm = document.getElementById('availability-form');
        if (availabilityForm) {
            availabilityForm.addEventListener('submit', async (e) => {
                try {
                    await addAvailability(e);
                } catch (err) {
                    showAlert(`Không thể thêm lịch rảnh: ${err.message}`, 'danger');
                }
            });
        }

        const onlineToggle = document.getElementById('online-toggle');
        if (onlineToggle) {
            onlineToggle.addEventListener('change', async () => {
                try {
                    await updateOnlineStatus();
                } catch (err) {
                    showAlert(`Không thể cập nhật online: ${err.message}`, 'danger');
                }
            });
        }

        const servicePriceForm = document.getElementById('service-price-form');
        if (servicePriceForm) {
            servicePriceForm.addEventListener('submit', async (e) => {
                try {
                    await addServicePrice(e);
                } catch (err) {
                    showAlert(`Không thể thêm bảng giá: ${err.message}`, 'danger');
                }
            });
        }

        const withdrawForm = document.getElementById('withdraw-form');
        if (withdrawForm) {
            withdrawForm.addEventListener('submit', async (e) => {
                try {
                    await createWithdrawal(e);
                } catch (err) {
                    showAlert(`Không thể rút tiền: ${err.message}`, 'danger');
                }
            });
        }

        const tasks = [];
        if (page === 'companion-dashboard') {
            tasks.push(loadBookingWorkflow(), loadIncomeStats());
        }
        if (page === 'companion-profile') {
            tasks.push(loadProfile());
        }
        if (page === 'companion-operations') {
            tasks.push(loadAvailabilities(), loadServicePrices());
        }
        if (page === 'companion-bookings') {
            tasks.push(loadBookings(), loadBookingWorkflow(), loadConsultations());
        }
        if (page === 'companion-finance') {
            tasks.push(loadIncomeStats(), loadWithdrawals());
        }
        if (page === 'companion-notifications') {
            tasks.push(loadCompanionNotifications());
        }
        await Promise.all(tasks);
    } catch (_) {
        window.location.href = '/user/login.html';
    }
}

function notifIcon(title) {
    const t = (title || '').toLowerCase();
    if (t.includes('booking') || t.includes('đặt lịch') || t.includes('lịch hẹn'))
        return { icon: 'bi-calendar-event-fill', bg: 'linear-gradient(135deg, #3b82f6, #6366f1)' };
    if (t.includes('thanh toán') || t.includes('tiền') || t.includes('rút'))
        return { icon: 'bi-wallet2', bg: 'linear-gradient(135deg, #10b981, #059669)' };
    if (t.includes('đánh giá') || t.includes('review'))
        return { icon: 'bi-star-fill', bg: 'linear-gradient(135deg, #f59e0b, #f97316)' };
    if (t.includes('báo cáo') || t.includes('sos') || t.includes('cảnh cáo'))
        return { icon: 'bi-exclamation-triangle-fill', bg: 'linear-gradient(135deg, #ef4444, #dc2626)' };
    if (t.includes('duyệt') || t.includes('companion') || t.includes('hồ sơ'))
        return { icon: 'bi-person-check-fill', bg: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' };
    return { icon: 'bi-bell-fill', bg: 'linear-gradient(135deg, #64748b, #94a3b8)' };
}

async function loadCompanionNotifications() {
    const listBox = document.getElementById('notification-list');
    const countBadge = document.getElementById('unread-count');
    const markAllBtn = document.getElementById('mark-all-read-btn');
    if (!listBox) return;

    async function render() {
        const list = await getJson('/api/companion/notifications/me');
        const unread = list.filter(n => !n.isRead).length;
        if (countBadge) countBadge.textContent = `${unread} chưa đọc`;

        if (!list.length) {
            listBox.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-bell-slash text-muted" style="font-size: 3rem;"></i>
                    <p class="text-muted mt-3 mb-0">Bạn chưa có thông báo nào</p>
                </div>`;
            return;
        }

        listBox.innerHTML = list.map(n => {
            const ic = notifIcon(n.title);
            const timeStr = fmtDateTime(n.createdAt);
            return `
            <div class="notif-item d-flex gap-3 align-items-start ${n.isRead ? '' : 'unread'}" data-id="${n.id}" data-read="${n.isRead}">
                <div class="notif-icon text-white" style="background: ${ic.bg};">
                    <i class="bi ${ic.icon}"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="notif-title">${escapeHtml(n.title)}</div>
                        ${!n.isRead ? '<span class="notif-dot ms-2 mt-2"></span>' : ''}
                    </div>
                    <div class="text-muted small mt-1">${escapeHtml(n.content)}</div>
                    <div class="notif-time mt-1"><i class="bi bi-clock me-1"></i>${timeStr}</div>
                </div>
            </div>`;
        }).join('');

        listBox.querySelectorAll('.notif-item[data-read="false"]').forEach(item => {
            item.addEventListener('click', async () => {
                const id = item.getAttribute('data-id');
                await fetch(`/api/companion/notifications/${id}/read`, { method: 'PATCH' });
                item.classList.remove('unread');
                item.setAttribute('data-read', 'true');
                const dot = item.querySelector('.notif-dot');
                if (dot) dot.remove();
                const refreshed = await getJson('/api/companion/notifications/me');
                const u = refreshed.filter(nn => !nn.isRead).length;
                if (countBadge) countBadge.textContent = `${u} chưa đọc`;
            });
        });
    }

    if (markAllBtn) {
        markAllBtn.addEventListener('click', async () => {
            await fetch('/api/companion/notifications/read-all', { method: 'PATCH' });
            await render();
        });
    }

    await render();
}

document.getElementById('logout-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/user/logout', { method: 'POST' });
    window.location.href = '/user/index.html';
});

bootstrap();
