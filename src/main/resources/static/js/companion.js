async function getJson(url, options = {}) {
    const res = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
            ...(options.headers || {})
        }
    });
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

const companionChartState = {
    range: 'month',
    bookingChart: null,
    statusChart: null,
    payload: null
};

function startOfWeekLocal(date) {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
}

function buildCompanionBuckets(range) {
    const now = new Date();
    const buckets = [];
    if (range === 'day') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            buckets.push({
                key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
                label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
            });
        }
    } else if (range === 'week') {
        const current = startOfWeekLocal(now);
        for (let i = 7; i >= 0; i--) {
            const d = new Date(current);
            d.setDate(d.getDate() - i * 7);
            const week = Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
            buckets.push({ key: `${d.getFullYear()}-W${week}`, label: `Tuần ${week}` });
        }
    } else if (range === 'year') {
        for (let i = 4; i >= 0; i--) {
            const y = now.getFullYear() - i;
            buckets.push({ key: String(y), label: String(y) });
        }
    } else {
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            buckets.push({
                key: `${d.getFullYear()}-${d.getMonth() + 1}`,
                label: d.toLocaleDateString('vi-VN', { month: '2-digit', year: '2-digit' })
            });
        }
    }
    return buckets;
}

function toCompanionBucketKey(dateValue, range) {
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return null;
    if (range === 'day') return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    if (range === 'week') {
        const s = startOfWeekLocal(d);
        const week = Math.ceil((((s - new Date(s.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
        return `${s.getFullYear()}-W${week}`;
    }
    if (range === 'year') return String(d.getFullYear());
    return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

async function loadCompanionDashboardCharts() {
    if (typeof Chart === 'undefined') return;
    const range = document.getElementById('companion-chart-range')?.value || companionChartState.range || 'month';
    companionChartState.range = range;
    if (!companionChartState.payload) {
        companionChartState.payload = await getJson('/api/companions/me/bookings');
    }
    const bookings = Array.isArray(companionChartState.payload) ? companionChartState.payload : [];
    const buckets = buildCompanionBuckets(range);
    const labels = buckets.map(b => b.label);
    const bucketIndex = {};
    buckets.forEach((b, i) => { bucketIndex[b.key] = i; });

    const acceptedSeries = new Array(labels.length).fill(0);
    const completedSeries = new Array(labels.length).fill(0);
    const incomeSeries = new Array(labels.length).fill(0);
    bookings.forEach((b) => {
        const key = toCompanionBucketKey(b.bookingTime, range);
        const idx = bucketIndex[key];
        if (idx == null) return;
        if (b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS') acceptedSeries[idx] += 1;
        if (b.status === 'COMPLETED') {
            completedSeries[idx] += 1;
            incomeSeries[idx] += Number(b.holdAmount || 0);
        }
    });

    const bookingCtx = document.getElementById('companion-booking-chart');
    if (bookingCtx) {
        companionChartState.bookingChart?.destroy();
        companionChartState.bookingChart = new Chart(bookingCtx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Đơn đang chạy/chấp nhận', data: acceptedSeries, backgroundColor: 'rgba(59,130,246,.7)' },
                    { label: 'Đơn hoàn tất', data: completedSeries, backgroundColor: 'rgba(16,185,129,.7)' },
                    { label: 'Doanh thu (VND)', data: incomeSeries, type: 'line', borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,.15)', yAxisID: 'y1', tension: 0.3 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, position: 'left' },
                    y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } }
                }
            }
        });
    }

    const statusCounts = { PENDING: 0, ACCEPTED: 0, IN_PROGRESS: 0, COMPLETED: 0, REJECTED: 0, CANCELLED: 0 };
    bookings.forEach((b) => {
        if (statusCounts[b.status] != null) statusCounts[b.status] += 1;
    });
    const statusCtx = document.getElementById('companion-status-chart');
    if (statusCtx) {
        companionChartState.statusChart?.destroy();
        companionChartState.statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'],
                datasets: [{
                    data: [
                        statusCounts.PENDING,
                        statusCounts.ACCEPTED,
                        statusCounts.IN_PROGRESS,
                        statusCounts.COMPLETED,
                        statusCounts.REJECTED,
                        statusCounts.CANCELLED
                    ],
                    backgroundColor: ['#64748b', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#94a3b8']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
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

let companionLeafletLoadPromise = null;
function ensureLeafletLoadedCompanion() {
    if (window.L) return Promise.resolve();
    if (companionLeafletLoadPromise) return companionLeafletLoadPromise;
    companionLeafletLoadPromise = new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.setAttribute('data-app-leaflet', '1');
        link.onload = () => {
            const s = document.createElement('script');
            s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Leaflet'));
            document.head.appendChild(s);
        };
        link.onerror = () => reject(new Error('Leaflet CSS'));
        document.head.appendChild(link);
    });
    return companionLeafletLoadPromise;
}

/** Gửi vị trí định kỳ khi đơn IN_PROGRESS (dashboard companion). */
const companionDashboardLiveIntervals = new Map();

function startCompanionDashboardLiveShare(bookingId) {
    const id = Number(bookingId);
    if (!id || companionDashboardLiveIntervals.has(id)) return;
    const tick = async () => {
        try {
            const loc = await getCurrentLocation();
            if (loc.lat == null || loc.lng == null) return;
            await sendJson(`/api/bookings/me/${id}/live-location`, 'POST', { lat: loc.lat, lng: loc.lng });
        } catch (_) {}
    };
    tick();
    companionDashboardLiveIntervals.set(id, setInterval(tick, 25000));
}

function stopCompanionDashboardLiveShare(bookingId) {
    const id = Number(bookingId);
    const t = companionDashboardLiveIntervals.get(id);
    if (t) clearInterval(t);
    companionDashboardLiveIntervals.delete(id);
}

function syncCompanionDashboardLiveShares(bookings) {
    const running = new Set((bookings || []).filter(b => b.status === 'IN_PROGRESS').map(b => Number(b.id)));
    for (const bid of companionDashboardLiveIntervals.keys()) {
        if (!running.has(bid)) stopCompanionDashboardLiveShare(bid);
    }
    running.forEach((bid) => startCompanionDashboardLiveShare(bid));
}

async function loadProfile() {
    try {
        const profile = await getJson('/api/companions/me/profile');
        document.getElementById('bio').value = profile.bio || '';
        document.getElementById('hobbies').value = profile.hobbies || '';
        document.getElementById('appearance').value = profile.appearance || '';
        document.getElementById('availability-text').value = profile.availability || '';
        document.getElementById('service-type').value = profile.serviceType || '';
        document.getElementById('area').value = profile.area || '';
        const rv = document.getElementById('rental-venues');
        if (rv) rv.value = profile.rentalVenues || '';
        document.getElementById('identity-number').value = profile.identityNumber || '';
        document.getElementById('identity-image-url').value = profile.identityImageUrl || '';
        document.getElementById('portrait-image-url').value = profile.portraitImageUrl || '';
        document.getElementById('intro-media-urls').value = profile.introMediaUrls || '';
        document.getElementById('skills').value = profile.skills || '';
        document.getElementById('online-toggle').checked = !!(profile.onlineStatus ?? profile.online);
        const statusEl = document.getElementById('companion-status');
        statusEl.className = `badge ${statusBadgeClass(profile.status)}`;
        statusEl.textContent = profile.status || 'N/A';
    } catch (err) {
        showAlert(`Không thể tải hồ sơ: ${err.message || err}`, 'danger');
        document.getElementById('bio').value = '';
        document.getElementById('hobbies').value = '';
        document.getElementById('appearance').value = '';
        document.getElementById('availability-text').value = '';
        const rv = document.getElementById('rental-venues');
        if (rv) rv.value = '';
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
        availability: document.getElementById('availability-text').value.trim(),
        serviceType: document.getElementById('service-type').value.trim(),
        area: document.getElementById('area').value.trim(),
        rentalVenues: (document.getElementById('rental-venues')?.value || '').trim(),
        onlineStatus: String(document.getElementById('online-toggle').checked)
    };
    try {
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
    } catch (err) {
        showAlert(`Không thể lưu hồ sơ: ${err.message || err}`, 'danger');
    }
}

async function updateOnlineStatus() {
    await sendJson('/api/companions/me/online', 'PATCH', {
        online: document.getElementById('online-toggle').checked
    });
    showAlert('Đã cập nhật trạng thái online.');
}

async function loadAvailabilities() {
    const rows = document.getElementById('availability-body');
    const modeHint = document.getElementById('availability-mode-hint');
    const profile = await getJson('/api/companions/me/profile');
    const bookings = await getJson('/api/companions/me/bookings');
    rows.innerHTML = '';

    if (modeHint) {
        if (profile?.online || profile?.onlineStatus) {
            modeHint.innerHTML = '<span class="badge text-bg-success me-2">ONLINE</span>Bạn đang online, hệ thống mặc định bạn rảnh toàn bộ ngoài các khung giờ bận bên dưới.';
        } else {
            modeHint.innerHTML = '<span class="badge text-bg-secondary me-2">OFFLINE</span>Bạn đang offline. Bật online để sẵn sàng nhận booking mới.';
        }
    }

    const busyStatuses = new Set(['PENDING', 'ACCEPTED', 'IN_PROGRESS']);
    const busySlots = (Array.isArray(bookings) ? bookings : [])
        .filter((b) => busyStatuses.has(b.status))
        .map((b) => {
            const start = b.bookingTime ? new Date(b.bookingTime) : null;
            const end = start ? new Date(start.getTime() + Number(b.duration || 0) * 60000) : null;
            return {
                id: b.id,
                start,
                end,
                status: b.status,
                customerName: b.customer?.fullName || b.customer?.username || `User #${b.customer?.id || '-'}`,
                location: b.location || '-'
            };
        })
        .filter((x) => x.start && x.end)
        .sort((a, b) => a.start - b.start);

    if (!busySlots.length) {
        rows.innerHTML = '<tr><td colspan="4" class="text-muted">Hiện chưa có khung giờ bận nào.</td></tr>';
        return;
    }

    busySlots.forEach((slot) => {
        const statusClass = slot.status === 'IN_PROGRESS'
            ? 'text-bg-danger'
            : (slot.status === 'ACCEPTED' ? 'text-bg-warning' : 'text-bg-secondary');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(fmtDateTime(slot.start))}</td>
            <td>${escapeHtml(fmtDateTime(slot.end))}</td>
            <td><span class="badge ${statusClass}">${escapeHtml(slot.status)}</span></td>
            <td>Booking #${slot.id} - ${escapeHtml(slot.customerName)} (${escapeHtml(slot.location)})</td>`;
        rows.appendChild(tr);
    });
}

async function addAvailability(e) {
    e?.preventDefault?.();
    showAlert('Lịch rảnh đã chuyển sang chế độ tự động theo trạng thái online và booking.', 'info');
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
    startCompanionDashboardLiveShare(bookingId);
    showAlert(`Đã check-in booking #${bookingId}.`);
}

async function checkOutBooking(bookingId) {
    const loc = await getCurrentLocation();
    await sendJson(`/api/companions/me/bookings/${bookingId}/checkout`, 'POST', {
        lat: loc.lat,
        lng: loc.lng
    });
    stopCompanionDashboardLiveShare(bookingId);
    await loadBookings();
    await loadBookingWorkflow();
    await loadIncomeStats();
    showAlert(`Đã check-out booking #${bookingId}.`);
}

async function sendSos(bookingId) {
    const noteInput = document.getElementById('sos-note-input');
    const note = (noteInput?.value || '').trim();
    if (!note) {
        showAlert('Vui lòng nhập nội dung SOS.', 'warning');
        return;
    }
    const loc = await getCurrentLocation();
    await sendJson(`/api/companions/me/bookings/${bookingId}/sos`, 'POST', {
        note,
        lat: loc.lat,
        lng: loc.lng
    });
    const modalEl = document.getElementById('sos-modal');
    const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
    modal?.hide();
    if (noteInput) noteInput.value = '';
    showAlert(`Đã gửi SOS cho booking #${bookingId}.`, 'warning');
}

function ensureSosModal() {
    let modalEl = document.getElementById('sos-modal');
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.className = 'modal fade';
    modalEl.id = 'sos-modal';
    modalEl.tabIndex = -1;
    modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-danger">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title"><i class="bi bi-exclamation-octagon-fill me-2"></i>Kích hoạt SOS</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning py-2">
                        SOS sẽ gửi cảnh báo ngay cho khách hàng và Admin.
                    </div>
                    <label class="form-label fw-semibold" for="sos-note-input">Nội dung khẩn cấp</label>
                    <textarea id="sos-note-input" class="form-control" rows="3" placeholder="Mô tả nhanh tình huống hiện tại..." required></textarea>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                    <button class="btn btn-danger" id="confirm-sos-btn"><i class="bi bi-broadcast-pin me-1"></i>Gửi SOS ngay</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalEl);
    return modalEl;
}

function openSosModal(booking) {
    const bookingId = Number(booking?.id || 0);
    if (!bookingId) {
        showAlert('Không tìm thấy thông tin booking để gửi SOS.', 'danger');
        return;
    }
    const modalEl = ensureSosModal();
    const noteInput = modalEl.querySelector('#sos-note-input');
    if (noteInput) {
        const customer = booking?.customer?.fullName || booking?.customer?.username || `User #${booking?.customer?.id || '-'}`;
        const bookingTime = fmtDateTime(booking?.bookingTime);
        const location = booking?.location || '-';
        noteInput.value = `SOS khẩn cấp tại booking #${bookingId}. Khách hàng: ${customer}. Thời gian: ${bookingTime}. Địa điểm: ${location}.`;
    }
    const confirmBtn = modalEl.querySelector('#confirm-sos-btn');
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            try {
                await sendSos(bookingId);
            } catch (err) {
                showAlert(`Không thể gửi SOS: ${err.message}`, 'danger');
            }
        };
    }
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
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
        const canSos = item.status === 'ACCEPTED' || item.status === 'IN_PROGRESS';
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
                ${canSos ? `<button class="btn btn-sm btn-danger" data-action="sos"><i class="bi bi-exclamation-octagon me-1"></i>SOS</button>` : ''}
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
        tr.querySelector('[data-action="sos"]')?.addEventListener('click', () => openSosModal(item));
        rows.appendChild(tr);
    });
    syncCompanionDashboardLiveShares(bookings);
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
        amount: document.getElementById('withdraw-amount').value
    });
    e.target.reset();
    await loadWithdrawals();
    await loadIncomeStats();
    showAlert('Đã tạo lệnh rút tiền.');
}

async function loadBankAccount() {
    const data = await getJson('/api/companions/me/bank-account');
    const bankName = document.getElementById('bank-name');
    const bankAccountNumber = document.getElementById('bank-account-number');
    const accountHolderName = document.getElementById('account-holder-name');
    if (bankName) bankName.value = data.bankName || '';
    if (bankAccountNumber) bankAccountNumber.value = data.bankAccountNumber || '';
    if (accountHolderName) accountHolderName.value = data.accountHolderName || '';
}

async function saveBankAccount(e) {
    e.preventDefault();
    await sendJson('/api/companions/me/bank-account', 'PUT', {
        bankName: document.getElementById('bank-name').value.trim(),
        bankAccountNumber: document.getElementById('bank-account-number').value.trim(),
        accountHolderName: document.getElementById('account-holder-name').value.trim()
    });
    showAlert('Đã lưu tài khoản ngân hàng nhận tiền.');
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
        await pollCompanionRealtimeNotifications();
        if (auth.userId && window.RealtimeStomp) {
            try {
                await RealtimeStomp.ensureLibs();
                await RealtimeStomp.connect();
                await RealtimeStomp.subscribeNotifications(Number(auth.userId), (n) => {
                    const id = Number(n.id);
                    if (!companionRealtimeNotifState.seenIds.has(id)) {
                        companionRealtimeNotifState.seenIds.add(id);
                        showCompanionNotificationToast(n);
                    }
                    pollCompanionRealtimeNotifications();
                });
            } catch (e) {
                console.warn('WebSocket thông báo không khả dụng, dùng polling', e);
                if (!companionRealtimeNotifState.timer) {
                    companionRealtimeNotifState.timer = setInterval(pollCompanionRealtimeNotifications, 4000);
                }
            }
        } else if (!companionRealtimeNotifState.timer) {
            companionRealtimeNotifState.timer = setInterval(pollCompanionRealtimeNotifications, 4000);
        }
        const page = document.body.dataset.page || 'companion-dashboard';
        if (page === 'companion-dashboard') {
            document.getElementById('companion-chart-range')?.addEventListener('change', async (e) => {
                companionChartState.range = e.target.value;
                await loadCompanionDashboardCharts();
            });
        }

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
        const bankAccountForm = document.getElementById('bank-account-form');
        if (bankAccountForm) {
            bankAccountForm.addEventListener('submit', async (e) => {
                try {
                    await saveBankAccount(e);
                } catch (err) {
                    showAlert(`Không thể lưu tài khoản ngân hàng: ${err.message}`, 'danger');
                }
            });
        }

        const tasks = [];
        if (page === 'companion-dashboard') {
            tasks.push(loadBookingWorkflow(), loadIncomeStats(), loadCompanionDashboardCharts());
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
            tasks.push(loadIncomeStats(), loadWithdrawals(), loadBankAccount());
        }
        if (page === 'companion-notifications') {
            tasks.push(loadCompanionNotifications());
        }
        if (page === 'companion-chat') {
            tasks.push(initCompanionChatPage());
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

const companionRealtimeNotifState = {
    initialized: false,
    seenIds: new Set(),
    timer: null
};

function getCompanionToastContainer() {
    let box = document.getElementById('companion-realtime-toast-container');
    if (box) return box;
    box = document.createElement('div');
    box.id = 'companion-realtime-toast-container';
    box.style.cssText = 'position:fixed;top:16px;right:16px;z-index:1080;display:flex;flex-direction:column;gap:8px;max-width:380px;';
    document.body.appendChild(box);
    return box;
}

function showCompanionNotificationToast(notification) {
    const box = getCompanionToastContainer();
    const item = document.createElement('div');
    item.className = 'shadow rounded-3 border bg-white p-3';
    item.innerHTML = `
        <div class="fw-semibold mb-1"><i class="bi bi-bell-fill text-primary me-2"></i>${escapeHtml(notification.title || 'Thông báo mới')}</div>
        <div class="small text-muted">${escapeHtml(notification.content || '')}</div>
    `;
    box.appendChild(item);
    setTimeout(() => item.remove(), 4500);
}

function processRealtimeCompanionNotifications(list) {
    const sorted = [...(Array.isArray(list) ? list : [])]
        .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    if (!companionRealtimeNotifState.initialized) {
        sorted.forEach(n => companionRealtimeNotifState.seenIds.add(Number(n.id)));
        companionRealtimeNotifState.initialized = true;
        return;
    }
    sorted.forEach((n) => {
        const id = Number(n.id);
        if (!companionRealtimeNotifState.seenIds.has(id)) {
            companionRealtimeNotifState.seenIds.add(id);
            showCompanionNotificationToast(n);
        }
    });
}

async function pollCompanionRealtimeNotifications() {
    try {
        const list = await getJson('/api/companion/notifications/me');
        processRealtimeCompanionNotifications(list);
    } catch (_) {
        // keep silent for transient issues
    }
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

async function initCompanionChatPage() {
    const bookingIdText = document.getElementById('chat-booking-id-text');
    const threadTitle = document.getElementById('chat-thread-title');
    const threadListBox = document.getElementById('chat-thread-list');
    let currentBookingId = Number(new URLSearchParams(window.location.search).get('bookingId') || 0);
    let threads = [];
    let chatStompSub = null;
    let chatPollTimer = null;
    let liveStompSub = null;
    let liveGeolocationTimer = null;
    let companionChatLeafletMap = null;
    let companionChatLeafletMarker = null;

    function companionChatThreadStatus() {
        const t = threads.find(x => x.bookingId === currentBookingId);
        return t ? t.status : null;
    }

    function tearDownCompanionChatLiveMap() {
        if (companionChatLeafletMap) {
            try {
                companionChatLeafletMap.remove();
            } catch (_) {}
            companionChatLeafletMap = null;
            companionChatLeafletMarker = null;
        }
        const wrap = document.getElementById('live-map-wrap');
        if (wrap) wrap.style.display = 'none';
    }

    async function paintCompanionChatLiveMap(lat, lng) {
        const wrap = document.getElementById('live-map-wrap');
        const canvas = document.getElementById('live-map-canvas');
        if (!wrap || !canvas || Number.isNaN(lat) || Number.isNaN(lng)) return;
        await ensureLeafletLoadedCompanion();
        const L = window.L;
        if (!L) return;
        wrap.style.display = 'block';
        await new Promise(r => requestAnimationFrame(r));
        if (!companionChatLeafletMap) {
            companionChatLeafletMap = L.map(canvas).setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19
            }).addTo(companionChatLeafletMap);
            companionChatLeafletMarker = L.marker([lat, lng]).addTo(companionChatLeafletMap);
        } else {
            companionChatLeafletMarker.setLatLng([lat, lng]);
            companionChatLeafletMap.setView([lat, lng], 15);
            companionChatLeafletMap.invalidateSize();
        }
    }

    function renderCompanionLivePanel(data) {
        const details = document.getElementById('live-location-details');
        if (!details) return;
        const st = companionChatThreadStatus();
        if (!currentBookingId || !st || !['ACCEPTED', 'IN_PROGRESS'].includes(st)) {
            tearDownCompanionChatLiveMap();
            details.innerHTML = 'Chỉ khi đơn ACCEPTED / IN_PROGRESS.';
            return;
        }
        if (!data || data.latitude == null || data.longitude == null) {
            tearDownCompanionChatLiveMap();
            details.innerHTML = 'Chưa có điểm. Khách cần mở chat và bật định vị.';
            return;
        }
        const roleLabel = data.role === 'COMPANION' ? 'Companion' : data.role === 'CUSTOMER' ? 'Khách' : escapeHtml(data.role || '');
        const maps = `https://www.google.com/maps?q=${encodeURIComponent(String(data.latitude) + ',' + String(data.longitude))}`;
        const lat = Number(data.latitude);
        const lng = Number(data.longitude);
        details.innerHTML = `<div class="mb-1"><span class="text-secondary fw-semibold">${roleLabel}</span> <span class="text-muted">@${escapeHtml(data.username || '')}</span></div>
            <div class="font-monospace small mb-1">${escapeHtml(String(lat))}, ${escapeHtml(String(lng))}</div>
            <div class="text-muted small mb-2">${escapeHtml(fmtDateTime(data.at))}</div>
            <a class="btn btn-sm btn-outline-primary" href="${maps}" target="_blank" rel="noopener">Mở Google Maps</a>`;
        paintCompanionChatLiveMap(lat, lng).catch(() => {});
    }

    async function fetchCompanionLiveSnapshot() {
        const st = companionChatThreadStatus();
        if (!currentBookingId || !st || !['ACCEPTED', 'IN_PROGRESS'].includes(st)) return;
        try {
            const data = await getJson(`/api/bookings/me/${currentBookingId}/live-location`);
            renderCompanionLivePanel(data);
        } catch (_) {
            renderCompanionLivePanel(null);
        }
    }

    async function resubscribeChatSocket() {
        if (chatStompSub && typeof chatStompSub.unsubscribe === 'function') {
            try { chatStompSub.unsubscribe(); } catch (_) {}
            chatStompSub = null;
        }
        if (!currentBookingId || !window.RealtimeStomp) return;
        try {
            await RealtimeStomp.connect();
            chatStompSub = await RealtimeStomp.subscribeChat(currentBookingId, () => {
                loadMessages();
            });
        } catch (e) {
            console.warn('WebSocket chat không khả dụng', e);
        }
    }

    async function resubscribeCompanionLiveSocket() {
        if (liveStompSub && typeof liveStompSub.unsubscribe === 'function') {
            try { liveStompSub.unsubscribe(); } catch (_) {}
            liveStompSub = null;
        }
        if (liveGeolocationTimer) {
            clearInterval(liveGeolocationTimer);
            liveGeolocationTimer = null;
        }
        const st = companionChatThreadStatus();
        if (!currentBookingId || !window.RealtimeStomp || !st || !['ACCEPTED', 'IN_PROGRESS'].includes(st)) {
            renderCompanionLivePanel(null);
            return;
        }
        await fetchCompanionLiveSnapshot();
        try {
            await RealtimeStomp.connect();
            liveStompSub = await RealtimeStomp.subscribeBookingLocation(currentBookingId, (payload) => renderCompanionLivePanel(payload));
        } catch (e) {
            console.warn('WebSocket vị trí không khả dụng', e);
        }
        const pushLoc = async () => {
            const loc = await getCurrentLocation();
            if (loc.lat == null || loc.lng == null) return;
            try {
                await sendJson(`/api/bookings/me/${currentBookingId}/live-location`, 'POST', { lat: loc.lat, lng: loc.lng });
            } catch (_) {}
        };
        pushLoc();
        liveGeolocationTimer = setInterval(pushLoc, 25000);
    }

    function updateThreadHeader() {
        if (!bookingIdText || !threadTitle) return;
        if (!currentBookingId) {
            bookingIdText.textContent = '-';
            threadTitle.textContent = 'Chưa chọn cuộc trò chuyện';
            return;
        }
        const active = threads.find(t => t.bookingId === currentBookingId);
        bookingIdText.textContent = String(currentBookingId);
        threadTitle.textContent = active ? `Khách hàng: ${active.partnerName}` : `Booking #${currentBookingId}`;
    }

    async function loadChatThreads() {
        const list = await getJson('/api/companions/me/bookings');
        threads = (Array.isArray(list) ? list : [])
            .filter(b => Number(b?.id || 0) > 0)
            .map(b => ({
                bookingId: Number(b.id),
                partnerName: b.customer?.fullName || b.customer?.username || `User #${b.customer?.id || '-'}`,
                status: b.status || '-',
                bookingTime: b.bookingTime
            }))
            .sort((a, b) => (new Date(b.bookingTime || 0)).getTime() - (new Date(a.bookingTime || 0)).getTime());
    }

    function resolveBookingForChat() {
        if (currentBookingId && threads.some(t => t.bookingId === currentBookingId)) {
            return currentBookingId;
        }
        const preferred = threads.find(t => ['IN_PROGRESS', 'ACCEPTED', 'PENDING', 'COMPLETED'].includes(t.status));
        return preferred ? preferred.bookingId : (threads[0]?.bookingId || 0);
    }

    function renderThreadList() {
        if (!threadListBox) return;
        if (!threads.length) {
            threadListBox.innerHTML = '<div class="p-3 text-muted">Chưa có cuộc trò chuyện khả dụng.</div>';
            return;
        }
        threadListBox.innerHTML = `<div class="list-group list-group-flush">${
            threads.map(t => {
                const active = t.bookingId === currentBookingId ? 'bg-light' : '';
                return `<button type="button" class="list-group-item list-group-item-action border-0 border-bottom ${active} chat-thread-item" data-booking-id="${t.bookingId}">
                        <div class="fw-semibold">${escapeHtml(t.partnerName)}</div>
                        <div class="small text-muted">#${t.bookingId} • ${escapeHtml(t.status)}</div>
                    </button>`;
            }).join('')
        }</div>`;
        threadListBox.querySelectorAll('.chat-thread-item').forEach(btn => {
            btn.addEventListener('click', async () => {
                currentBookingId = Number(btn.getAttribute('data-booking-id'));
                updateThreadHeader();
                renderThreadList();
                await loadMessages();
                await resubscribeChatSocket();
                await resubscribeCompanionLiveSocket();
            });
        });
    }

    async function loadMessages() {
        const box = document.getElementById('chat-list');
        if (!box) return;
        if (!currentBookingId) {
            box.innerHTML = '<div class="text-muted">Chưa có cuộc trò chuyện để hiển thị.</div>';
            return;
        }
        let list = [];
        try {
            list = await getJson(`/api/chat/${currentBookingId}/messages`);
        } catch (err) {
            box.innerHTML = `<div class="text-danger">Không thể tải tin nhắn: ${escapeHtml(err.message || 'Lỗi không xác định')}</div>`;
            return;
        }
        box.innerHTML = list.length ? list.map(m => `
            <div class="mb-2">
                <div class="small text-muted">${escapeHtml(m.sender?.username || 'Ẩn danh')} • ${escapeHtml(fmtDateTime(m.createdAt))}</div>
                <div class="p-2 rounded border bg-white">${escapeHtml(m.content || '')}</div>
            </div>
        `).join('') : '<div class="text-muted">Chưa có tin nhắn.</div>';
        box.scrollTop = box.scrollHeight;
    }

    document.getElementById('chat-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentBookingId) {
            showAlert('Không tìm thấy booking phù hợp để chat.', 'warning');
            return;
        }
        const input = document.getElementById('chat-content');
        const content = (input?.value || '').trim();
        if (!content) return;
        try {
            await getJson(`/api/chat/${currentBookingId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            if (input) input.value = '';
            await loadMessages();
        } catch (err) {
            showAlert(`Gửi tin nhắn thất bại: ${err.message}`, 'danger');
        }
    });

    document.getElementById('call-btn')?.addEventListener('click', async () => {
        if (!currentBookingId) {
            showAlert('Vui lòng chọn cuộc trò chuyện trước.', 'warning');
            return;
        }
        const box = document.getElementById('call-info');
        if (!box) return;
        try {
            const info = await getJson(`/api/chat/${currentBookingId}/call`);
            const contactPhone = info.contactPhone || info.customerPhone || '-';
            box.innerHTML = `<div class="alert alert-success mb-0">VoIP room: <strong>${escapeHtml(info.roomId)}</strong> | token: ${escapeHtml(info.token)}<br><strong>SĐT liên hệ:</strong> ${escapeHtml(contactPhone)}</div>`;
        } catch (err) {
            box.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(err.message || 'Không thể lấy thông tin call')}</div>`;
        }
    });

    await loadChatThreads();
    currentBookingId = resolveBookingForChat();
    updateThreadHeader();
    renderThreadList();
    await loadMessages();
    if (window.RealtimeStomp) {
        try {
            await RealtimeStomp.ensureLibs();
            await resubscribeChatSocket();
            await resubscribeCompanionLiveSocket();
            if (!chatStompSub) {
                chatPollTimer = setInterval(loadMessages, 3000);
            }
        } catch (e) {
            console.warn('Chat realtime lỗi, dùng polling', e);
            chatPollTimer = setInterval(loadMessages, 3000);
        }
    } else {
        chatPollTimer = setInterval(loadMessages, 3000);
        await fetchCompanionLiveSnapshot();
    }
}

document.getElementById('logout-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/user/logout', { method: 'POST' });
    window.location.href = '/user/index.html';
});

bootstrap();
