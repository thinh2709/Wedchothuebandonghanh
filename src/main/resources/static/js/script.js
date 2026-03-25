document.addEventListener('DOMContentLoaded', () => {
    updateAuthNavigation();
    const companionGrid = document.getElementById('companion-grid');

    if (companionGrid) {
        fetch('/api/companions')
            .then(response => response.json())
            .then(data => {
                companionGrid.innerHTML = '';
                if (data.length === 0) {
                    companionGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Chưa có bạn đồng hành nào được duyệt.</p>';
                    return;
                }
                data.forEach(companion => {
                    const card = document.createElement('div');
                    card.className = 'companion-card';
                    const avatarDiv = `
                        <div class="companion-img">
                          ${
                              companion.avatarUrl
                                  ? `<img src="${String(companion.avatarUrl)}" alt="avatar" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:0;"/>`
                                  : ''
                          }
                        </div>
                    `;
                    card.innerHTML = `
                        ${avatarDiv}
                        <div class="companion-info">
                            <div class="companion-name">${companion.user.fullName || companion.user.username}</div>
                            <div class="companion-bio">${companion.bio || 'Chưa có giới thiệu.'}</div>
                            <a href="/user/profile.html?id=${companion.id}" class="btn" style="background-color: var(--primary-color); color: white; padding: 0.5rem 1rem; width: 100%; text-align: center;">Xem hồ sơ</a>
                        </div>
                    `;
                    companionGrid.appendChild(card);
                });
            })
            .catch(error => {
                console.error('Error fetching companions:', error);
                companionGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Lỗi khi tải dữ liệu. Vui lòng thử lại sau.</p>';
            });
    }
});

function updateAuthNavigation() {
    const nav = document.querySelector('header nav');
    if (!nav) {
        return;
    }

    fetch('/api/auth/me')
        .then(response => response.json())
        .then(auth => {
            if (!auth.authenticated) {
                return;
            }

            const links = Array.from(nav.querySelectorAll('a'));
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href === '/login' || href === '/login.html'
                    || href === '/register' || href === '/register.html'
                    || href === '/user/login' || href === '/user/register'
                    || href === '/user/login.html' || href === '/user/register.html') {
                    link.remove();
                }
            });

            if (auth.role === 'COMPANION') {
                const dashboardLink = document.createElement('a');
                dashboardLink.href = '/companion/dashboard.html';
                dashboardLink.textContent = 'Khu vực Companion';
                nav.appendChild(dashboardLink);
            }

            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.textContent = 'Đăng xuất';
            logoutLink.addEventListener('click', (event) => {
                event.preventDefault();
                fetch('/api/user/logout', { method: 'POST' })
                    .then(() => {
                        window.location.href = '/user/index.html';
                    })
                    .catch(error => {
                        console.error('Error logging out:', error);
                    });
            });
            nav.appendChild(logoutLink);
        })
        .catch(error => {
            console.error('Error fetching auth status:', error);
        });
}
