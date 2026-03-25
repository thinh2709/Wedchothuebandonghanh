async function getJson(url, options = {}) {
    const res = await fetch(url, { credentials: 'same-origin', ...options });
    if (!res.ok) {
        throw new Error(await res.text());
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

async function uploadCompanionFile(endpoint, file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        body: fd
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    const data = await res.json();
    return data.url;
}

async function uploadCompanionFiles(endpoint, files) {
    const fd = new FormData();
    (files || []).forEach((f) => {
        if (f) fd.append('files', f);
    });
    const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        body: fd
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    const data = await res.json();
    return data.url;
}

async function registerCompanion(e) {
    e.preventDefault();

    const availabilityOption = document.getElementById('availability-option')?.value || '';
    const availabilityCustomEl = document.getElementById('availability-custom');
    const availabilityCustom = availabilityCustomEl?.value?.trim() || '';
    const availabilityValue = availabilityOption === 'CUSTOM' ? availabilityCustom : availabilityOption;

    if (!availabilityValue) {
        throw new Error('Vui lòng chọn/tự nhập lịch rảnh tổng quan.');
    }

    // Tạo companion trước (status PENDING) từ endpoint /api/companions/register.
    // Sau đó gọi thêm các endpoint /me/profile, /me/identity, /me/media-skills
    // để cập nhật đầy đủ hồ sơ từ form register này.
    const payload = {
        bio: document.getElementById('bio').value.trim(),
        hobbies: document.getElementById('hobbies').value.trim(),
        appearance: document.getElementById('appearance').value.trim(),
        availability: availabilityValue,
        serviceType: document.getElementById('service-type')?.value?.trim() || '',
        area: document.getElementById('area')?.value?.trim() || '',
        rentalVenues: document.getElementById('rental-venues')?.value?.trim() || '',
        gender: document.getElementById('gender')?.value?.trim() || '',
        onlineStatus: String(document.getElementById('online-toggle')?.checked || false),
        avatarUrl: '',
        introVideoUrl: document.getElementById('intro-video-url')?.value?.trim() || '',
    };

    let coverUrl = '';
    let identityImageUrl = '';
    let portraitImageUrl = '';
    let introMediaUrls = '';

    await getJson('/api/companions/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    // Nếu chọn file ảnh từ máy: upload -> backend trả URL -> set lại input URL.
    const avatarFile = document.getElementById('avatar-file')?.files?.[0];
    if (avatarFile) {
        const url = await uploadCompanionFile('/api/companions/me/upload/avatar', avatarFile);
        payload.avatarUrl = url;
    }

    const coverFile = document.getElementById('cover-file')?.files?.[0];
    if (coverFile) {
        coverUrl = await uploadCompanionFile('/api/companions/me/upload/cover', coverFile);
    }

    const identityImageFile = document.getElementById('identity-image-file')?.files?.[0];
    if (identityImageFile) {
        identityImageUrl = await uploadCompanionFile('/api/companions/me/upload/identity-image', identityImageFile);
    }

    const portraitImageFile = document.getElementById('portrait-image-file')?.files?.[0];
    if (portraitImageFile) {
        portraitImageUrl = await uploadCompanionFile('/api/companions/me/upload/portrait-image', portraitImageFile);
    }

    const introMediaFilesInput = document.getElementById('intro-media-files');
    const introMediaFiles = introMediaFilesInput?.files ? Array.from(introMediaFilesInput.files) : [];
    if (introMediaFiles.length > 0) {
        introMediaUrls = await uploadCompanionFiles('/api/companions/me/upload/intro-media', introMediaFiles);
    }

    // Cập nhật phần còn lại (cover, identity, album/video, skills) và các field có thể đã có sẵn.
    const profilePayload = {
        ...payload,
        coverUrl: coverUrl
    };

    await getJson('/api/companions/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload)
    });

    await getJson('/api/companions/me/identity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            identityNumber: document.getElementById('identity-number')?.value?.trim() || '',
            identityImageUrl: identityImageUrl,
            portraitImageUrl: portraitImageUrl
        })
    });

    await getJson('/api/companions/me/media-skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            introMediaUrls: introMediaUrls,
            skills: document.getElementById('skills')?.value?.trim() || ''
        })
    });

    showAlert('Gửi đăng ký thành công. Vui lòng chờ Admin duyệt hồ sơ.', 'success');
    setTimeout(() => {
        window.location.href = '/companion/dashboard.html';
    }, 1000);
}

async function bootstrap() {
    try {
        const auth = await getJson('/api/auth/me');
        if (!auth.authenticated) {
            window.location.href = '/login';
            return;
        }
        document.getElementById('auth-user').textContent = `Xin chào, ${auth.username}`;
        if (auth.role === 'COMPANION') {
            showAlert('Tài khoản đã là Companion. Chuyển sang dashboard quản lý.', 'info');
            setTimeout(() => {
                window.location.href = '/companion/dashboard.html';
            }, 800);
            return;
        }

        // Toggle trường lịch rảnh tuỳ chọn.
        const availabilityOptionEl = document.getElementById('availability-option');
        const availabilityCustomEl = document.getElementById('availability-custom');
        if (availabilityOptionEl && availabilityCustomEl) {
            const sync = () => {
                const isCustom = availabilityOptionEl.value === 'CUSTOM';
                availabilityCustomEl.classList.toggle('d-none', !isCustom);
                availabilityCustomEl.required = isCustom;
            };
            availabilityOptionEl.addEventListener('change', sync);
            sync();
        }

        // Tránh bấm Enter trong input vô tình submit form.
        const serviceTypeEl = document.getElementById('service-type');
        if (serviceTypeEl) {
            serviceTypeEl.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter') {
                    ev.preventDefault();
                }
            });
        }

        document.getElementById('register-form').addEventListener('submit', async (e) => {
            try {
                await registerCompanion(e);
            } catch (err) {
                showAlert(`Không thể đăng ký: ${err.message}`, 'danger');
            }
        });
    } catch (_) {
        window.location.href = '/login';
    }
}

document.getElementById('logout-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/user/index.html';
});

bootstrap();
