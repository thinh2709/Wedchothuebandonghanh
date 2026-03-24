function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN");
}

function toLocalInputDateTime(value) {
    const date = value ? new Date(value) : new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        credentials: "same-origin",
        ...options
    });
    return response;
}

async function getAuth() {
    const response = await apiFetch("/api/auth/me", { headers: {} });
    return response.json();
}

function setMessage(targetId, type, text) {
    const box = document.getElementById(targetId);
    if (!box) return;
    if (!text) {
        box.innerHTML = "";
        return;
    }
    box.innerHTML = `<div class="alert alert-${type} mb-0">${escapeHtml(text)}</div>`;
}

function renderTopNav(auth) {
    const nav = document.getElementById("top-nav");
    if (!nav) return;

    const authPart = auth.authenticated
        ? `
            <span class="navbar-text me-3">Xin chao, <strong>${escapeHtml(auth.username)}</strong></span>
            <button id="logout-btn" class="btn btn-outline-danger btn-sm">Dang xuat</button>
        `
        : `
            <a class="btn btn-outline-primary btn-sm me-2" href="/user/login.html">Dang nhap</a>
            <a class="btn btn-primary btn-sm" href="/user/register.html">Dang ky</a>
        `;

    nav.innerHTML = `
        <a class="btn btn-link text-decoration-none" href="/user/index.html">Trang chu</a>
        <a class="btn btn-link text-decoration-none" href="/user/search.html">Tim kiem</a>
        <a class="btn btn-link text-decoration-none" href="/user/appointments.html">Lich hen</a>
        <a class="btn btn-link text-decoration-none" href="/user/favorites.html">Yeu thich</a>
        <a class="btn btn-link text-decoration-none" href="/user/review.html">Danh gia</a>
        <a class="btn btn-link text-decoration-none" href="/user/report.html">To cao</a>
        ${authPart}
    `;

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await fetch("/api/user/logout", { method: "POST", credentials: "same-origin" });
            window.location.href = "/user/index.html";
        });
    }
}

function companionCard(companion, showActions) {
    const name = companion.user?.fullName || companion.user?.username || "Unknown";
    const bio = companion.bio || "Chua co mo ta";
    const availability = companion.availability || "Chua cap nhat";
    const actions = showActions
        ? `
            <div class="d-grid gap-2">
                <a class="btn btn-outline-primary btn-sm" href="/user/profile.html?id=${companion.id}">Xem chi tiet</a>
                <a class="btn btn-primary btn-sm" href="/user/booking.html?id=${companion.id}">Dat lich</a>
            </div>
        `
        : "";
    return `
        <div class="col">
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${escapeHtml(name)}</h5>
                    <p class="card-text mb-2"><strong>Bio:</strong> ${escapeHtml(bio)}</p>
                    <p class="card-text text-muted"><strong>Ranh:</strong> ${escapeHtml(availability)}</p>
                    ${actions}
                </div>
            </div>
        </div>
    `;
}

async function initCompanionGrid(targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;
    try {
        const response = await apiFetch("/api/companions");
        const companions = await response.json();
        if (!companions.length) {
            container.innerHTML = '<div class="alert alert-info">Chua co companion.</div>';
            return;
        }
        container.innerHTML = companions.map((c) => companionCard(c, true)).join("");
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Khong tai duoc danh sach companion.</div>';
    }
}

async function bootstrapLayout() {
    const auth = await getAuth().catch(() => ({ authenticated: false }));
    renderTopNav(auth);
    return auth;
}

window.userApp = {
    apiFetch,
    bootstrapLayout,
    getAuth,
    formatDateTime,
    toLocalInputDateTime,
    escapeHtml,
    initCompanionGrid,
    setMessage
};
