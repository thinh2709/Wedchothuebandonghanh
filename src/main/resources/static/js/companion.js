async function getJson(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

(async () => {
    try {
        const auth = await getJson('/api/auth/me');
        if (!auth.authenticated) {
            window.location.href = '/user/login.html';
            return;
        }
        document.getElementById('auth-user').textContent = `Xin chao, ${auth.username}`;
    } catch (_) {
        window.location.href = '/user/login.html';
    }
})();

document.getElementById('logout-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/user/logout', { method: 'POST' });
    window.location.href = '/user/index.html';
});
