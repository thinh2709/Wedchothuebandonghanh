async function getJson(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

async function loadPending() {
    const rows = document.getElementById('pending-body');
    const data = await getJson('/api/admin/pending-companions');
    rows.innerHTML = '';
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.user?.username || ''}</td>
            <td>${item.bio || ''}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="approve(${item.id})">Duyet</button>
                <button class="btn btn-sm btn-danger" onclick="reject(${item.id})">Tu choi</button>
            </td>
        `;
        rows.appendChild(tr);
    });
}

async function approve(id) {
    await getJson(`/api/admin/approve-companion/${id}`, { method: 'POST' });
    await loadPending();
}

async function reject(id) {
    await getJson(`/api/admin/reject-companion/${id}`, { method: 'POST' });
    await loadPending();
}

document.getElementById('logout-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/user/index.html';
});

loadPending().catch(console.error);
