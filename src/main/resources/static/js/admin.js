async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
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
            <td>
                <button class="btn btn-sm btn-warning me-1" data-action="warn" data-id="${user.id}">Cảnh cáo</button>
                <button class="btn btn-sm btn-danger" data-action="ban" data-id="${user.id}">Khóa</button>
            </td>
        `;
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
}

async function updateUserFlag(userId, action) {
    const endpoint = action === "warn" ? "warn" : "ban";
    await requestJson(`/api/admin/users/${userId}/${endpoint}`, { method: "POST" });
    showAlert(action === "warn" ? "Đã cảnh cáo tài khoản." : "Đã khóa tài khoản.");
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
    }
}

bootstrapAdminPage().catch((error) => {
    console.error(error);
    showAlert("Không thể tải dữ liệu admin. Vui lòng thử lại.", "danger");
});
