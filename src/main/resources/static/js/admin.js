async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
        window.location.href = "/user/login.html";
        throw new Error("Unauthorized");
    }
    if (!response.ok) {
        const text = await response.text();
        let message = text;
        try {
            const json = JSON.parse(text);
            message = json.message || text;
        } catch (_) {}
        throw new Error(message);
    }
    return response.json();
}

function showAlert(message, type = "success") {
    const box = document.getElementById("admin-alert");
    if (!box) {
        return;
    }
    box.innerHTML = `<div class="alert alert-${type} mb-0">${message}</div>`;
}

function clearAlert() {
    const box = document.getElementById("admin-alert");
    if (box) {
        box.innerHTML = "";
    }
}

function readAuthEvidence() {
    const localRole = localStorage.getItem("role");
    const sessionRole = sessionStorage.getItem("role");
    const localUserId = localStorage.getItem("userId") || localStorage.getItem("user_id");
    const sessionUserId = sessionStorage.getItem("userId") || sessionStorage.getItem("user_id");
    const localToken = localStorage.getItem("token") || localStorage.getItem("jwt");
    const sessionToken = sessionStorage.getItem("token") || sessionStorage.getItem("jwt");
    const hasSessionCookie = document.cookie.includes("JSESSIONID=");

    return {
        role: sessionRole || localRole,
        hasUserId: Boolean(localUserId || sessionUserId),
        hasToken: Boolean(localToken || sessionToken),
        hasSessionCookie
    };
}

async function ensureAdminAccess() {
    try {
        const me = await requestJson("/api/auth/me", { method: "GET" });
        if (!me?.authenticated || me.role !== "ADMIN") {
            window.location.href = "/user/login.html";
            return false;
        }
        return true;
    } catch (_) {
        const auth = readAuthEvidence();
        const hasAdminSignal = auth.role === "ADMIN" && (auth.hasUserId || auth.hasToken || auth.hasSessionCookie);
        if (hasAdminSignal) {
            return true;
        }
        window.location.href = "/user/login.html";
        return false;
    }
}

function formatMoney(value) {
    const number = Number(value || 0);
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(number);
}

function escapeHtml(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function buildUserActionButtons(userId) {
    const template = document.getElementById("user-actions-template");
    if (template?.content) {
        const fragment = template.content.cloneNode(true);
        fragment.querySelectorAll("button[data-action]").forEach((button) => {
            button.dataset.id = String(userId);
        });
        return fragment;
    }

    const fallback = document.createDocumentFragment();
    const warnBtn = document.createElement("button");
    warnBtn.className = "btn btn-sm btn-warning me-1";
    warnBtn.dataset.action = "warn";
    warnBtn.dataset.id = String(userId);
    warnBtn.textContent = "Cảnh cáo";

    const banBtn = document.createElement("button");
    banBtn.className = "btn btn-sm btn-danger me-1";
    banBtn.dataset.action = "ban";
    banBtn.dataset.id = String(userId);
    banBtn.textContent = "Khóa";

    const resetBtn = document.createElement("button");
    resetBtn.className = "btn btn-sm btn-success";
    resetBtn.dataset.action = "reset-status";
    resetBtn.dataset.id = String(userId);
    resetBtn.setAttribute("data-cy", "btn-reset-status");
    resetBtn.textContent = "Bình thường";

    fallback.append(warnBtn, banBtn, resetBtn);
    return fallback;
}

function bindLogout() {
    const logoutBtn = document.getElementById("logout-btn");
    if (!logoutBtn) {
        return;
    }
    logoutBtn.addEventListener("click", async () => {
        await fetch("/logout", { method: "POST" });
        window.location.href = "/user/index.html";
    });
}

async function loadDashboardStats() {
    const stats = await requestJson("/api/admin/dashboard-stats");
    const profitEl = document.getElementById("stat-profit");
    const totalEl = document.getElementById("stat-transactions");
    const cancelledEl = document.getElementById("stat-cancelled");

    if (profitEl) profitEl.textContent = formatMoney(stats.platformProfit);
    if (totalEl) totalEl.textContent = String(stats.totalTransactions ?? 0);
    if (cancelledEl) cancelledEl.textContent = String(stats.cancelledBookings ?? 0);
}

async function loadPendingCompanions(tableBodyId) {
    const rows = document.getElementById(tableBodyId);
    if (!rows) {
        return;
    }
    const data = await requestJson("/api/admin/pending-companions");
    rows.innerHTML = "";

    if (!data.length) {
        rows.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Không có hồ sơ chờ duyệt.</td></tr>';
        return;
    }

    data.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${escapeHtml(item.user?.username || "")}</td>
            <td>${escapeHtml(item.bio || "")}</td>
            <td><span class="badge text-bg-warning">${escapeHtml(item.status || "PENDING")}</span></td>
            <td>
                <button class="btn btn-sm btn-success me-1" data-action="approve" data-id="${item.id}">Cấp tích xanh</button>
                <button class="btn btn-sm btn-danger" data-action="reject" data-id="${item.id}">Từ chối</button>
            </td>
        `;
        rows.appendChild(tr);
    });

    rows.querySelectorAll('button[data-action="approve"]').forEach((btn) => {
        btn.addEventListener("click", () => moderateCompanion(btn.dataset.id, true, tableBodyId));
    });
    rows.querySelectorAll('button[data-action="reject"]').forEach((btn) => {
        btn.addEventListener("click", () => moderateCompanion(btn.dataset.id, false, tableBodyId));
    });
}

async function moderateCompanion(id, isApprove, tableBodyId) {
    const url = isApprove ? `/api/admin/approve-companion/${id}` : `/api/admin/reject-companion/${id}`;
    await requestJson(url, { method: "POST" });
    showAlert(isApprove ? "Đã cấp tích xanh cho Companion." : "Đã từ chối hồ sơ Companion.");
    await loadPendingCompanions(tableBodyId);
    if (document.getElementById("stat-profit")) {
        await loadDashboardStats();
    }
}

async function loadUsersPage() {
    const usersBody = document.getElementById("users-body");
    const companionsBody = document.getElementById("companions-body");
    const data = await requestJson("/api/admin/users");
    usersBody.innerHTML = "";
    companionsBody.innerHTML = "";

    data.users.forEach((user) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${escapeHtml(user.username)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(user.role)}</td>
            <td><span class="badge ${user.flag === "BANNED" ? "text-bg-danger" : user.flag === "WARNED" ? "text-bg-warning" : "text-bg-secondary"}">${escapeHtml(user.flag === "BANNED" ? "Đã khóa" : user.flag === "WARNED" ? "Đã cảnh cáo" : "Bình thường")}</span></td>
            <td class="user-actions-cell"></td>
        `;
        const actionsCell = tr.querySelector(".user-actions-cell");
        if (actionsCell) {
            actionsCell.appendChild(buildUserActionButtons(user.id));
        }
        usersBody.appendChild(tr);
    });

    data.companions.forEach((companion) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${companion.id}</td>
            <td>${escapeHtml(companion.username)}</td>
            <td>${escapeHtml(companion.status)}</td>
            <td>${escapeHtml(companion.flag)}</td>
            <td>${escapeHtml(companion.bio || "")}</td>
        `;
        companionsBody.appendChild(tr);
    });

    usersBody.querySelectorAll('button[data-action="warn"]').forEach((btn) => {
        btn.addEventListener("click", () => updateUserFlag(btn.dataset.id, "warn"));
    });
    usersBody.querySelectorAll('button[data-action="ban"]').forEach((btn) => {
        btn.addEventListener("click", () => updateUserFlag(btn.dataset.id, "ban"));
    });
    usersBody.querySelectorAll('button[data-action="reset-status"]').forEach((btn) => {
        btn.addEventListener("click", () => updateUserFlag(btn.dataset.id, "reset-status"));
    });
}

async function updateUserFlag(userId, action) {
    let endpoint = "ban";
    let method = "POST";
    let successMessage = "Đã khóa tài khoản.";

    if (action === "warn") {
        endpoint = "warn";
        successMessage = "Đã cảnh cáo tài khoản.";
    } else if (action === "reset-status") {
        const confirmed = window.confirm("Bạn có chắc chắn muốn khôi phục trạng thái bình thường cho người dùng này không?");
        if (!confirmed) {
            return;
        }
        endpoint = "reset-status";
        method = "PUT";
        successMessage = "Đã khôi phục trạng thái bình thường cho tài khoản.";
    }

    await requestJson(`/api/admin/users/${userId}/${endpoint}`, { method });
    showAlert(successMessage);
    await loadUsersPage();
}

async function loadModerationPage() {
    await loadPendingCompanions("moderation-pending-body");

    const reviewsBody = document.getElementById("reviews-body");
    const reviews = await requestJson("/api/admin/moderation/reviews");
    reviewsBody.innerHTML = "";
    if (!reviews.length) {
        reviewsBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Không có review cần xử lý.</td></tr>';
        return;
    }

    reviews.forEach((review) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${review.id}</td>
            <td>${review.bookingId || ""}</td>
            <td>${review.rating || ""}</td>
            <td>${escapeHtml(review.comment || "")}</td>
            <td><span class="badge ${review.hidden ? "text-bg-danger" : "text-bg-success"}">${review.hidden ? "Đã ẩn" : "Hiển thị"}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-danger" ${review.hidden ? "disabled" : ""} data-id="${review.id}">Ẩn bình luận</button>
            </td>
        `;
        reviewsBody.appendChild(tr);
    });

    reviewsBody.querySelectorAll("button[data-id]").forEach((btn) => {
        btn.addEventListener("click", () => hideReview(btn.dataset.id));
    });
}

async function hideReview(reviewId) {
    await requestJson(`/api/admin/moderation/reviews/${reviewId}/hide`, { method: "POST" });
    showAlert("Đã ẩn review vi phạm.");
    await loadModerationPage();
}

async function loadTransactionsPage() {
    const data = await requestJson("/api/admin/transactions");
    const commissionInput = document.getElementById("commission-rate");
    if (commissionInput) {
        commissionInput.value = data.commissionRate ?? 0.15;
    }

    const tbody = document.getElementById("withdrawals-body");
    tbody.innerHTML = "";
    if (!data.pendingWithdrawals.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Không có lệnh rút tiền chờ duyệt.</td></tr>';
        return;
    }

    data.pendingWithdrawals.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${escapeHtml(item.companionName || "")}</td>
            <td>${escapeHtml(item.bankName || "")}</td>
            <td>${escapeHtml(item.bankAccountNumber || "")}</td>
            <td>${formatMoney(item.amount)}</td>
            <td><span class="badge text-bg-warning">${escapeHtml(item.status)}</span></td>
            <td>
                <button class="btn btn-sm btn-success me-1" data-action="approve" data-id="${item.id}">Duyệt</button>
                <button class="btn btn-sm btn-danger" data-action="reject" data-id="${item.id}">Từ chối</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-action="approve"]').forEach((btn) => {
        btn.addEventListener("click", () => reviewWithdrawal(btn.dataset.id, true));
    });
    tbody.querySelectorAll('button[data-action="reject"]').forEach((btn) => {
        btn.addEventListener("click", () => reviewWithdrawal(btn.dataset.id, false));
    });
}

async function reviewWithdrawal(id, approve) {
    const url = approve
        ? `/api/admin/transactions/withdrawals/${id}/approve`
        : `/api/admin/transactions/withdrawals/${id}/reject`;
    await requestJson(url, { method: "POST" });
    showAlert(approve ? "Đã duyệt lệnh rút tiền." : "Đã từ chối lệnh rút tiền.");
    await loadTransactionsPage();
}

async function saveCommissionRate(event) {
    event.preventDefault();
    const value = Number(document.getElementById("commission-rate").value);
    await requestJson("/api/admin/transactions/commission-rate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate: value })
    });
    showAlert("Đã cập nhật tỷ lệ hoa hồng.");
    await loadTransactionsPage();
}

async function loadDisputesPage() {
    const disputes = await requestJson("/api/admin/disputes");
    const tbody = document.getElementById("disputes-body");
    tbody.innerHTML = "";
    if (!disputes.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Không có tranh chấp.</td></tr>';
        return;
    }

    disputes.forEach((dispute) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${dispute.id}</td>
            <td>${escapeHtml(dispute.reporter || "")}</td>
            <td>${escapeHtml(dispute.reportedUser || "")}</td>
            <td>${escapeHtml(dispute.reason || "")}</td>
            <td><span class="badge ${dispute.status === "RESOLVED" ? "text-bg-success" : "text-bg-warning"}">${escapeHtml(dispute.status)}</span></td>
            <td class="action-group">
                <button class="btn btn-sm btn-secondary" data-action="freeze" data-id="${dispute.id}">Đóng băng ký quỹ</button>
                <button class="btn btn-sm btn-outline-primary" data-action="refund" data-id="${dispute.id}">Hoàn tiền</button>
                <button class="btn btn-sm btn-outline-success" data-action="payout" data-id="${dispute.id}">Thanh toán</button>
                <button class="btn btn-sm btn-dark" data-action="close" data-id="${dispute.id}">Đóng hồ sơ</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll("button[data-action]").forEach((btn) => {
        btn.addEventListener("click", () => processDispute(btn.dataset.id, btn.dataset.action));
    });
}

async function processDispute(id, action) {
    const map = {
        freeze: "freeze-escrow",
        refund: "refund",
        payout: "payout",
        close: "close"
    };
    const endpoint = map[action];
    await requestJson(`/api/admin/disputes/${id}/${endpoint}`, { method: "POST" });
    showAlert("Đã cập nhật xử lý tranh chấp.");
    await loadDisputesPage();
}

function notifIcon(title) {
    const t = (title || "").toLowerCase();
    if (t.includes("booking") || t.includes("đặt lịch"))
        return { icon: "bi-calendar-event-fill", bg: "linear-gradient(135deg, #3b82f6, #6366f1)" };
    if (t.includes("thanh toán") || t.includes("tiền") || t.includes("rút") || t.includes("hoa hồng"))
        return { icon: "bi-wallet2", bg: "linear-gradient(135deg, #10b981, #059669)" };
    if (t.includes("đánh giá") || t.includes("review"))
        return { icon: "bi-star-fill", bg: "linear-gradient(135deg, #f59e0b, #f97316)" };
    if (t.includes("báo cáo") || t.includes("report") || t.includes("sos") || t.includes("tranh chấp"))
        return { icon: "bi-exclamation-triangle-fill", bg: "linear-gradient(135deg, #ef4444, #dc2626)" };
    if (t.includes("duyệt") || t.includes("companion") || t.includes("hồ sơ"))
        return { icon: "bi-person-check-fill", bg: "linear-gradient(135deg, #8b5cf6, #a78bfa)" };
    if (t.includes("người dùng") || t.includes("user") || t.includes("đăng ký"))
        return { icon: "bi-people-fill", bg: "linear-gradient(135deg, #06b6d4, #0891b2)" };
    return { icon: "bi-bell-fill", bg: "linear-gradient(135deg, #64748b, #94a3b8)" };
}

function fmtDateTimeAdmin(value) {
    if (!value) return "";
    return new Date(value).toLocaleString("vi-VN");
}

async function loadAdminNotifications() {
    const listBox = document.getElementById("notification-list");
    const countBadge = document.getElementById("unread-count");
    const markAllBtn = document.getElementById("mark-all-read-btn");
    if (!listBox) return;

    async function render() {
        const list = await requestJson("/api/admin/notifications/me");
        const unread = list.filter(n => !n.isRead).length;
        if (countBadge) countBadge.textContent = `${unread} chưa đọc`;

        if (!list.length) {
            listBox.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-bell-slash text-muted" style="font-size: 3rem;"></i>
                    <p class="text-muted mt-3 mb-0">Không có thông báo</p>
                </div>`;
            return;
        }

        listBox.innerHTML = list.map(n => {
            const ic = notifIcon(n.title);
            const timeStr = fmtDateTimeAdmin(n.createdAt);
            return `
            <div class="notif-item d-flex gap-3 align-items-start ${n.isRead ? "" : "unread"}" data-id="${n.id}" data-read="${n.isRead}">
                <div class="notif-icon text-white" style="background: ${ic.bg};">
                    <i class="bi ${ic.icon}"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="notif-title">${escapeHtml(n.title)}</div>
                        ${!n.isRead ? '<span class="notif-dot ms-2 mt-2"></span>' : ""}
                    </div>
                    <div class="text-muted small mt-1">${escapeHtml(n.content)}</div>
                    <div class="notif-time mt-1"><i class="bi bi-clock me-1"></i>${timeStr}</div>
                </div>
            </div>`;
        }).join("");

        listBox.querySelectorAll('.notif-item[data-read="false"]').forEach(item => {
            item.addEventListener("click", async () => {
                const id = item.getAttribute("data-id");
                await fetch(`/api/admin/notifications/${id}/read`, { method: "PATCH" });
                item.classList.remove("unread");
                item.setAttribute("data-read", "true");
                const dot = item.querySelector(".notif-dot");
                if (dot) dot.remove();
                const refreshed = await requestJson("/api/admin/notifications/me");
                const u = refreshed.filter(nn => !nn.isRead).length;
                if (countBadge) countBadge.textContent = `${u} chưa đọc`;
            });
        });
    }

    if (markAllBtn) {
        markAllBtn.addEventListener("click", async () => {
            await fetch("/api/admin/notifications/read-all", { method: "PATCH" });
            await render();
        });
    }

    await render();
}

function setupPageEvents() {
    const path = window.location.pathname;
    if (path.endsWith("/dashboard.html")) {
        document.getElementById("reload-pending-btn")?.addEventListener("click", async () => {
            clearAlert();
            await loadDashboardStats();
            await loadPendingCompanions("pending-body");
        });
    }
    if (path.endsWith("/users.html")) {
        document.getElementById("reload-users-btn")?.addEventListener("click", async () => {
            clearAlert();
            await loadUsersPage();
        });
    }
    if (path.endsWith("/moderation.html")) {
        document.getElementById("reload-moderation-btn")?.addEventListener("click", async () => {
            clearAlert();
            await loadModerationPage();
        });
    }
    if (path.endsWith("/transactions.html")) {
        document.getElementById("reload-transactions-btn")?.addEventListener("click", async () => {
            clearAlert();
            await loadTransactionsPage();
        });
        document.getElementById("commission-form")?.addEventListener("submit", saveCommissionRate);
    }
    if (path.endsWith("/disputes.html")) {
        document.getElementById("reload-disputes-btn")?.addEventListener("click", async () => {
            clearAlert();
            await loadDisputesPage();
        });
    }
}

async function bootstrapAdminPage() {
    bindLogout();
    setupPageEvents();

    const path = window.location.pathname;
    if (path.endsWith("/dashboard.html")) {
        await loadDashboardStats();
        await loadPendingCompanions("pending-body");
    } else if (path.endsWith("/users.html")) {
        await loadUsersPage();
    } else if (path.endsWith("/moderation.html")) {
        await loadModerationPage();
    } else if (path.endsWith("/transactions.html")) {
        await loadTransactionsPage();
    } else if (path.endsWith("/disputes.html")) {
        await loadDisputesPage();
    } else if (path.endsWith("/notifications.html")) {
        await loadAdminNotifications();
    }
}

ensureAdminAccess().then((allowed) => {
    if (!allowed) {
        return;
    }
    bootstrapAdminPage().catch((error) => {
        console.error(error);
        showAlert("Không thể tải dữ liệu admin. Vui lòng thử lại.", "danger");
    });
});
