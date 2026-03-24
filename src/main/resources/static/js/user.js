async function apiFetch(url, options = {}) {
    return fetch(url, {
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

function toDateInputValue(value) {
    const date = value ? new Date(value) : new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
}

function setMessage(targetId, type, text) {
    const node = document.getElementById(targetId);
    if (!node) return;
    node.innerHTML = text ? `<div class="alert alert-${type} mb-0">${escapeHtml(text)}</div>` : "";
}

async function getAuth() {
    const res = await apiFetch("/api/auth/me", { headers: {} });
    return res.ok ? res.json() : { authenticated: false };
}

function renderTopNav(auth) {
    const nav = document.getElementById("top-nav");
    if (!nav) return;
    const links = `
        <a class="btn btn-link text-decoration-none" href="/user/index.html">Trang chu</a>
        <a class="btn btn-link text-decoration-none" href="/user/search.html">Tim kiem</a>
        <a class="btn btn-link text-decoration-none" href="/user/booking.html">Dat lich</a>
        <a class="btn btn-link text-decoration-none" href="/user/appointments.html">Lich hen</a>
        <a class="btn btn-link text-decoration-none" href="/user/chat.html?bookingId=">Chat/Call</a>
        <a class="btn btn-link text-decoration-none" href="/user/wallet.html">Vi tien</a>
        <a class="btn btn-link text-decoration-none" href="/user/favorites.html">Yeu thich</a>
        <a class="btn btn-link text-decoration-none" href="/user/review.html">Danh gia</a>
        <a class="btn btn-link text-decoration-none" href="/user/report.html">To cao</a>
        <a class="btn btn-link text-decoration-none position-relative" href="#" id="notification-link">Thong bao <span id="notification-badge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none">0</span></a>
    `;
    const authPart = auth.authenticated
        ? `<span class="navbar-text ms-2">Xin chao, <strong>${escapeHtml(auth.username)}</strong></span>
           <button id="logout-btn" class="btn btn-outline-danger btn-sm ms-2">Dang xuat</button>`
        : `<a class="btn btn-outline-primary btn-sm ms-2" href="/user/login.html">Dang nhap</a>
           <a class="btn btn-primary btn-sm ms-2" href="/user/register.html">Dang ky</a>`;
    nav.innerHTML = `${links}${authPart}`;
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await fetch("/api/user/logout", { method: "POST", credentials: "same-origin" });
            window.location.href = "/user/index.html";
        });
    }
}

function companionCard(companion) {
    const name = companion.user?.fullName || companion.user?.username || "Companion";
    const rating = companion.averageRating ? `${Number(companion.averageRating).toFixed(1)} ★ (${companion.reviewCount || 0})` : "Chua co danh gia";
    return `
    <div class="col">
      <div class="card user-card h-100">
        <div class="card-body">
          <h5 class="card-title">${escapeHtml(name)} <span class="badge bg-warning text-dark small">${rating}</span></h5>
          <p class="card-text mb-2"><strong>Bio:</strong> ${escapeHtml(companion.bio || "Chua co")}</p>
          <p class="card-text mb-2"><strong>So thich:</strong> ${escapeHtml(companion.hobbies || "Chua co")}</p>
          <p class="card-text mb-2"><strong>Dich vu:</strong> ${escapeHtml(companion.serviceType || "-")} | <strong>Khu vuc:</strong> ${escapeHtml(companion.area || "-")}</p>
          <p class="card-text mb-3"><strong>Gia:</strong> ${Number(companion.pricePerHour || 0).toLocaleString("vi-VN")} VND/h | <strong>Online:</strong> ${companion.onlineStatus ? "Yes" : "No"}</p>
          <div class="d-grid gap-2">
            <a class="btn btn-outline-primary btn-sm" href="/user/profile.html?id=${companion.id}">Xem profile</a>
            <a class="btn btn-primary btn-sm" href="/user/booking.html?id=${companion.id}">Dat lich</a>
          </div>
        </div>
      </div>
    </div>`;
}

async function loadCompanions(targetId) {
    const box = document.getElementById(targetId);
    if (!box) return [];
    const res = await apiFetch("/api/companions");
    const companions = res.ok ? await res.json() : [];
    box.innerHTML = companions.length
        ? companions.map(companionCard).join("")
        : `<div class="empty-state">Chua co companion nao.</div>`;
    return companions;
}

function requireLogin(auth) {
    if (!auth.authenticated) {
        window.location.href = "/user/login.html";
        return false;
    }
    return true;
}

async function initIndexPage() {
    await loadCompanions("companion-grid");
}

async function initSearchPage() {
    let companions = await loadCompanions("companion-grid");
    const keyword = document.getElementById("keyword");
    const form = document.getElementById("search-form");
    const grid = document.getElementById("companion-grid");
    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const q = (keyword.value || "").trim().toLowerCase();
        const params = new URLSearchParams();
        ["serviceType", "area", "gender", "gameRank", "minPrice", "maxPrice", "online"].forEach((id) => {
            const value = document.getElementById(id)?.value;
            if (value !== undefined && value !== null && value !== "") params.set(id, value);
        });
        const api = await apiFetch(`/api/companions/search?${params.toString()}`, { headers: {} });
        companions = api.ok ? await api.json() : companions;
        const filtered = companions.filter((c) => {
            const text = `${c.user?.fullName || ""} ${c.user?.username || ""} ${c.bio || ""} ${c.hobbies || ""}`.toLowerCase();
            return !q || text.includes(q);
        });
        grid.innerHTML = filtered.length ? filtered.map(companionCard).join("") : `<div class="empty-state">Khong tim thay ket qua phu hop.</div>`;
    });
}

async function initProfilePage(auth) {
    const id = new URLSearchParams(window.location.search).get("id");
    const box = document.getElementById("profile-container");
    if (!id || !box) return;
    const res = await apiFetch(`/api/companions/${id}`);
    const companion = await res.json();
    const name = companion.user?.fullName || companion.user?.username || "Companion";
    const rating = companion.averageRating ? `${Number(companion.averageRating).toFixed(1)} ★ (${companion.reviewCount || 0})` : "Chua co danh gia";
    box.innerHTML = `
        <div class="card user-card"><div class="card-body">
          ${companion.avatarUrl ? `<img src="${escapeHtml(companion.avatarUrl)}" alt="avatar" class="img-fluid rounded mb-3" style="max-height:220px;object-fit:cover;">` : ""}
          <h1 class="h4 mb-1">${escapeHtml(name)}</h1>
          <div class="mb-3 text-warning fw-bold">${rating}</div>
          <p><strong>Bio:</strong> ${escapeHtml(companion.bio || "Chua co")}</p>
          <p><strong>So thich:</strong> ${escapeHtml(companion.hobbies || "Chua co")}</p>
          <p><strong>Ngoai hinh:</strong> ${escapeHtml(companion.appearance || "Chua co")}</p>
          <p><strong>Thoi gian ranh:</strong> ${escapeHtml(companion.availability || "Chua co")}</p>
          <p><strong>Dich vu:</strong> ${escapeHtml(companion.serviceType || "-")} | <strong>Rank:</strong> ${escapeHtml(companion.gameRank || "-")}</p>
          <p><strong>Khu vuc:</strong> ${escapeHtml(companion.area || "-")} | <strong>Gioi tinh:</strong> ${escapeHtml(companion.gender || "-")}</p>
          <p><strong>Ty le phan hoi:</strong> ${Number(companion.responseRate || 0).toFixed(0)}%</p>
          ${companion.introVideoUrl ? `<a class="btn btn-sm btn-outline-dark mb-3" href="${escapeHtml(companion.introVideoUrl)}" target="_blank">Xem video gioi thieu</a>` : ""}
          <div class="d-flex gap-2 flex-wrap">
            <a class="btn btn-primary" href="/user/booking.html?id=${companion.id}">Dat lich</a>
            <a class="btn btn-outline-secondary" href="/user/review.html">Danh gia</a>
            <a class="btn btn-outline-warning" href="/user/report.html?reportedUserId=${companion.user?.id || ""}">To cao / SOS</a>
            ${auth.authenticated ? `<button id="add-favorite-btn" class="btn btn-outline-danger">Them yeu thich</button>` : ""}
          </div>
          <div id="profile-message" class="mt-3"></div>
        </div></div>`;
    const addBtn = document.getElementById("add-favorite-btn");
    if (addBtn) {
        addBtn.addEventListener("click", async () => {
            const response = await apiFetch(`/api/favorites/${companion.id}`, { method: "POST", headers: {} });
            if (response.ok) {
                setMessage("profile-message", "success", "Da them vao yeu thich");
            } else {
                setMessage("profile-message", "danger", "Them yeu thich that bai");
            }
        });
    }
}

async function initBookingPage(auth) {
    if (!requireLogin(auth)) return;
    const params = new URLSearchParams(window.location.search);
    const companionId = params.get("id");
    const companionSelect = document.getElementById("companionId");
    const companions = await (async () => {
        const res = await apiFetch("/api/companions");
        return res.ok ? res.json() : [];
    })();
    companionSelect.innerHTML = companions.map((c) => {
        const name = c.user?.fullName || c.user?.username || `Companion #${c.id}`;
        return `<option value="${c.id}">${escapeHtml(name)}</option>`;
    }).join("");
    if (companionId) companionSelect.value = companionId;
    document.getElementById("bookingTime").value = toDateInputValue();

    document.getElementById("booking-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            companionId: Number(document.getElementById("companionId").value),
            bookingTime: document.getElementById("bookingTime").value,
            duration: Number(document.getElementById("duration").value),
            location: document.getElementById("location").value,
            note: document.getElementById("note").value
        };
        const res = await apiFetch("/api/bookings", { method: "POST", body: JSON.stringify(payload) });
        if (res.ok) {
            window.location.href = "/user/appointments.html";
        } else {
            setMessage("booking-message", "danger", "Dat lich that bai. Vui long kiem tra thong tin.");
        }
    });
}

async function initAppointmentsPage(auth) {
    if (!requireLogin(auth)) return;
    const box = document.getElementById("appointment-list");
    const res = await apiFetch("/api/bookings/me", { headers: {} });
    const bookings = res.ok ? await res.json() : [];
    box.innerHTML = bookings.length ? bookings.map((b) => `
      <div class="card user-card mb-3"><div class="card-body">
        <h5>${escapeHtml(b.companion?.user?.fullName || b.companion?.user?.username || "Companion")}</h5>
        <div class="row">
          <div class="col-md-6"><strong>Thoi gian:</strong> ${escapeHtml(formatDateTime(b.bookingTime))}</div>
          <div class="col-md-6"><strong>Thoi luong:</strong> ${escapeHtml(b.duration)} phut</div>
          <div class="col-md-6"><strong>Tien coc:</strong> ${escapeHtml(Number(b.holdAmount || 0).toLocaleString("vi-VN"))} VND</div>
          <div class="col-md-6"><strong>Dia diem:</strong> ${escapeHtml(b.location || "-")}</div>
          <div class="col-md-6"><strong>Trang thai:</strong> ${escapeHtml(b.status || "-")}</div>
          <div class="col-12 mt-2"><strong>Ghi chu:</strong> ${escapeHtml(b.note || "-")}</div>
        </div>
        <div class="d-flex gap-2 mt-3">
          ${b.status === "PENDING" || b.status === "ACCEPTED" ? `<button class="btn btn-outline-danger btn-sm booking-action" data-id="${b.id}" data-action="cancel">Huy don</button>` : ""}
          ${b.status === "ACCEPTED" ? `<button class="btn btn-outline-primary btn-sm booking-action" data-id="${b.id}" data-action="check-in">Check-in</button>` : ""}
          ${b.status === "IN_PROGRESS" ? `<button class="btn btn-success btn-sm booking-action" data-id="${b.id}" data-action="check-out">Check-out</button>` : ""}
          ${(b.status === "ACCEPTED" || b.status === "IN_PROGRESS") ? `<button class="btn btn-outline-secondary btn-sm booking-action" data-id="${b.id}" data-action="extend">Gia han 30p</button>` : ""}
          ${(b.status === "ACCEPTED" || b.status === "IN_PROGRESS") ? `<a class="btn btn-outline-dark btn-sm" href="/user/chat.html?bookingId=${b.id}">Chat/Call</a>` : ""}
        </div>
      </div></div>`).join("") : `<div class="empty-state">Ban chua co lich hen nao.</div>`;

    box.querySelectorAll(".booking-action").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");
            const action = btn.getAttribute("data-action");
            const res = action === "extend"
                ? await apiFetch(`/api/bookings/me/${id}/extend`, { method: "PATCH", body: JSON.stringify({ extraMinutes: 30 }) })
                : await apiFetch(`/api/bookings/me/${id}/${action}`, { method: "PATCH", headers: {} });
            if (!res.ok) {
                const text = await res.text();
                alert(text || "Thao tac that bai");
                return;
            }
            await initAppointmentsPage(auth);
        });
    });
}

async function initFavoritesPage(auth) {
    if (!requireLogin(auth)) return;
    const box = document.getElementById("favorite-list");
    const res = await apiFetch("/api/favorites/me", { headers: {} });
    const list = res.ok ? await res.json() : [];
    box.innerHTML = list.length ? list.map((item) => {
        const c = item.companion || {};
        const name = c.user?.fullName || c.user?.username || `Companion #${c.id || ""}`;
        return `<div class="card user-card mb-3"><div class="card-body d-flex justify-content-between align-items-center">
            <div><h5 class="mb-1">${escapeHtml(name)}</h5><div class="text-muted">${escapeHtml(c.bio || "")}</div></div>
            <div class="d-flex gap-2">
                <a href="/user/profile.html?id=${c.id}" class="btn btn-outline-primary btn-sm">Xem</a>
                <button class="btn btn-outline-danger btn-sm remove-favorite" data-id="${c.id}">Xoa</button>
            </div>
        </div></div>`;
    }).join("") : `<div class="empty-state">Danh sach yeu thich trong.</div>`;

    box.querySelectorAll(".remove-favorite").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");
            const del = await apiFetch(`/api/favorites/${id}`, { method: "DELETE", headers: {} });
            if (del.ok) {
                await initFavoritesPage(auth);
            }
        });
    });
}

function renderStars(targetId, value) {
    const root = document.getElementById(targetId);
    if (!root) return;
    root.querySelectorAll(".star-btn").forEach((btn) => {
        const star = Number(btn.getAttribute("data-value"));
        btn.classList.toggle("active", star <= value);
    });
}

async function initReviewPage(auth) {
    if (!requireLogin(auth)) return;
    let selectedRating = 5;
    renderStars("rating-stars", selectedRating);
    document.querySelectorAll("#rating-stars .star-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            selectedRating = Number(btn.getAttribute("data-value"));
            renderStars("rating-stars", selectedRating);
        });
    });

    const bookingSelect = document.getElementById("bookingId");
    const bookingsRes = await apiFetch("/api/bookings/me", { headers: {} });
    const bookings = bookingsRes.ok ? await bookingsRes.json() : [];
    const completed = bookings.filter((b) => b.status === "COMPLETED");
    bookingSelect.innerHTML = completed.map((b) => `<option value="${b.id}">#${b.id} - ${escapeHtml(b.companion?.user?.username || "Companion")} (${escapeHtml(formatDateTime(b.bookingTime))})</option>`).join("");
    if (!completed.length) {
        bookingSelect.innerHTML = `<option value="">Khong co lich hen da hoan thanh</option>`;
    }

    document.getElementById("review-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const bookingId = Number(bookingSelect.value);
        if (!bookingId) {
            setMessage("review-message", "warning", "Ban can co lich hen COMPLETED de danh gia.");
            return;
        }
        const payload = {
            bookingId,
            rating: selectedRating,
            comment: document.getElementById("comment").value
        };
        const res = await apiFetch("/api/reviews", { method: "POST", body: JSON.stringify(payload) });
        if (res.ok) {
            setMessage("review-message", "success", "Gui danh gia thanh cong.");
            document.getElementById("review-form").reset();
            selectedRating = 5;
            renderStars("rating-stars", selectedRating);
            await loadMyReviews();
        } else {
            const text = await res.text();
            setMessage("review-message", "danger", text || "Gui danh gia that bai.");
        }
    });

    async function loadMyReviews() {
        const res = await apiFetch("/api/reviews/me", { headers: {} });
        const reviews = res.ok ? await res.json() : [];
        const box = document.getElementById("review-list");
        box.innerHTML = reviews.length ? reviews.map((r) => `
            <div class="card user-card mb-2"><div class="card-body">
              <div><strong>Booking #${r.booking?.id || "-"}</strong> - ${"★".repeat(r.rating || 0)}</div>
              <div class="text-muted small">${escapeHtml(formatDateTime(r.createdAt))}</div>
              <div>${escapeHtml(r.comment || "")}</div>
            </div></div>`).join("") : `<div class="empty-state">Ban chua co danh gia nao.</div>`;
    }

    await loadMyReviews();
}

async function initReportPage(auth) {
    if (!requireLogin(auth)) return;
    const params = new URLSearchParams(window.location.search);
    const reportedUserInput = document.getElementById("reportedUserId");
    if (params.get("reportedUserId")) {
        reportedUserInput.value = params.get("reportedUserId");
    }
    document.getElementById("report-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            reportedUserId: Number(reportedUserInput.value),
            reason: document.getElementById("reason").value,
            category: document.getElementById("reportCategory").value,
            emergency: document.getElementById("isEmergency").checked
        };
        const res = await apiFetch("/api/reports", { method: "POST", body: JSON.stringify(payload) });
        if (res.ok) {
            setMessage("report-message", "success", "Gui to cao thanh cong.");
            document.getElementById("report-form").reset();
            await loadMyReports();
        } else {
            const text = await res.text();
            setMessage("report-message", "danger", text || "Gui to cao that bai.");
        }
    });

    async function loadMyReports() {
        const res = await apiFetch("/api/reports/me", { headers: {} });
        const reports = res.ok ? await res.json() : [];
        const box = document.getElementById("report-list");
        box.innerHTML = reports.length ? reports.map((r) => `
            <div class="card user-card mb-2"><div class="card-body">
              <div><strong>To cao user #${r.reportedUser?.id || "-"}</strong> - ${escapeHtml(r.status || "PENDING")}</div>
              <div><strong>Loai:</strong> ${escapeHtml(r.category || "OTHER")} ${r.emergency ? '<span class="badge bg-danger">SOS</span>' : ''}</div>
              <div class="text-muted small">${escapeHtml(formatDateTime(r.createdAt))}</div>
              <div>${escapeHtml(r.reason || "")}</div>
            </div></div>`).join("") : `<div class="empty-state">Ban chua gui to cao nao.</div>`;
    }

    await loadMyReports();
}

async function initChatPage(auth) {
    if (!requireLogin(auth)) return;
    const params = new URLSearchParams(window.location.search);
    const bookingInput = document.getElementById("chat-booking-id");
    if (params.get("bookingId")) bookingInput.value = params.get("bookingId");
    let currentBookingId = Number(bookingInput.value || 0);

    async function loadMessages() {
        currentBookingId = Number(bookingInput.value || 0);
        if (!currentBookingId) return;
        const res = await apiFetch(`/api/chat/${currentBookingId}/messages`, { headers: {} });
        const list = res.ok ? await res.json() : [];
        const box = document.getElementById("chat-list");
        box.innerHTML = list.map((m) => `<div class="mb-2"><strong>${escapeHtml(m.sender?.username || "user")}:</strong> ${escapeHtml(m.content)} <span class="text-muted small">(${escapeHtml(formatDateTime(m.createdAt))})</span></div>`).join("") || `<div class="text-muted">Chua co tin nhan.</div>`;
        box.scrollTop = box.scrollHeight;
    }

    document.getElementById("load-chat-btn")?.addEventListener("click", loadMessages);
    document.getElementById("chat-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        currentBookingId = Number(bookingInput.value || 0);
        if (!currentBookingId) {
            setMessage("chat-message", "warning", "Vui long nhap booking ID.");
            return;
        }
        const content = document.getElementById("chat-content").value.trim();
        if (!content) return;
        const res = await apiFetch(`/api/chat/${currentBookingId}/messages`, { method: "POST", body: JSON.stringify({ content }) });
        if (res.ok) {
            document.getElementById("chat-content").value = "";
            await loadMessages();
        } else {
            const text = await res.text();
            setMessage("chat-message", "danger", text || "Gui tin nhan that bai");
        }
    });
    document.getElementById("call-btn")?.addEventListener("click", async () => {
        currentBookingId = Number(bookingInput.value || 0);
        if (!currentBookingId) return;
        const res = await apiFetch(`/api/chat/${currentBookingId}/call`, { headers: {} });
        const box = document.getElementById("call-info");
        if (res.ok) {
            const info = await res.json();
            box.innerHTML = `<div class="alert alert-success mb-0">VoIP room: <strong>${escapeHtml(info.roomId)}</strong> | token: ${escapeHtml(info.token)}</div>`;
        } else {
            box.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(await res.text())}</div>`;
        }
    });

    await loadMessages();
    setInterval(loadMessages, 5000);
}

async function refreshNotifications() {
    const link = document.getElementById("notification-link");
    const badge = document.getElementById("notification-badge");
    if (!link || !badge) return;
    const res = await apiFetch("/api/notifications/me", { headers: {} });
    if (!res.ok) return;
    const list = await res.json();
    const unread = list.filter((n) => !n.isRead).length;
    badge.textContent = String(unread);
    badge.classList.toggle("d-none", unread <= 0);
    link.onclick = (e) => {
        e.preventDefault();
        alert(list.slice(0, 10).map((n) => `- ${n.title}: ${n.content}`).join("\n") || "Khong co thong bao");
    };
}

async function initWalletPage(auth) {
    if (!requireLogin(auth)) return;
    const walletRes = await apiFetch("/api/wallet/me", { headers: {} });
    const wallet = walletRes.ok ? await walletRes.json() : { balance: 0 };
    document.getElementById("wallet-balance").textContent = `${Number(wallet.balance || 0).toLocaleString("vi-VN")} VND`;

    document.getElementById("deposit-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            amount: Number(document.getElementById("depositAmount").value),
            provider: document.getElementById("provider").value
        };
        const res = await apiFetch("/api/wallet/deposit", { method: "POST", body: JSON.stringify(payload) });
        if (res.ok) {
            setMessage("wallet-message", "success", "Nap tien thanh cong");
            document.getElementById("deposit-form").reset();
            await initWalletPage(auth);
        } else {
            const text = await res.text();
            setMessage("wallet-message", "danger", text || "Nap tien that bai");
        }
    });

    const txRes = await apiFetch("/api/wallet/transactions", { headers: {} });
    const txs = txRes.ok ? await txRes.json() : [];
    const box = document.getElementById("wallet-transactions");
    box.innerHTML = txs.length ? txs.map((t) => `
        <tr>
            <td>${escapeHtml(formatDateTime(t.createdAt))}</td>
            <td>${escapeHtml(t.type || "-")}</td>
            <td>${escapeHtml(t.provider || "-")}</td>
            <td>${escapeHtml(t.description || "-")}</td>
            <td class="${Number(t.amount) < 0 ? "text-danger" : "text-success"}">${Number(t.amount || 0).toLocaleString("vi-VN")} VND</td>
        </tr>
    `).join("") : `<tr><td colspan="5" class="text-muted">Chua co giao dich.</td></tr>`;
}

function initAuthPages() {
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const payload = Object.fromEntries(formData.entries());
            const res = await apiFetch("/api/user/login", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.success) {
                if (result.role === "ADMIN") window.location.href = "/admin/dashboard.html";
                else if (result.role === "COMPANION") window.location.href = "/companion/dashboard.html";
                else window.location.href = "/user/index.html";
            } else {
                setMessage("auth-message", "danger", result.message || "Dang nhap that bai");
            }
        });
    }

    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const payload = Object.fromEntries(formData.entries());
            const res = await apiFetch("/api/user/register", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.success) {
                window.location.href = "/user/login.html?registered=1";
            } else {
                setMessage("auth-message", "danger", result.message || "Dang ky that bai");
            }
        });
    }

    const params = new URLSearchParams(window.location.search);
    const registered = params.get("registered");
    if (document.getElementById("auth-message")) {
        if (registered === "1") setMessage("auth-message", "success", "Dang ky thanh cong, vui long dang nhap.");
    }
}

async function bootstrap() {
    const page = document.body.dataset.page;
    const auth = await getAuth().catch(() => ({ authenticated: false }));
    renderTopNav(auth);
    if (auth.authenticated) {
        await refreshNotifications();
        setInterval(refreshNotifications, 5000);
    }
    if (page === "login" || page === "register") {
        initAuthPages();
        return;
    }
    if (page === "index") await initIndexPage();
    if (page === "search") await initSearchPage();
    if (page === "profile") await initProfilePage(auth);
    if (page === "booking") await initBookingPage(auth);
    if (page === "appointments") await initAppointmentsPage(auth);
    if (page === "favorites") await initFavoritesPage(auth);
    if (page === "review") await initReviewPage(auth);
    if (page === "report") await initReportPage(auth);
    if (page === "wallet") await initWalletPage(auth);
    if (page === "chat") await initChatPage(auth);
}

document.addEventListener("DOMContentLoaded", bootstrap);
