# Chia project theo team

Project đã được tách theo 3 vai trò để chia việc nhóm:

## Backend

- `com.hutech.nguyenphucthinh.controller.admin`
- `com.hutech.nguyenphucthinh.controller.user`
- `com.hutech.nguyenphucthinh.controller.companion`
- `com.hutech.nguyenphucthinh.service.admin`
- `com.hutech.nguyenphucthinh.service.user`
- `com.hutech.nguyenphucthinh.service.companion`

## Frontend

- `src/main/resources/static/admin/dashboard.html`
- `src/main/resources/static/user/index.html`
- `src/main/resources/static/user/login.html`
- `src/main/resources/static/user/register.html`
- `src/main/resources/static/user/search.html`
- `src/main/resources/static/user/profile.html`
- `src/main/resources/static/user/booking.html`
- `src/main/resources/static/user/appointments.html`
- `src/main/resources/static/user/favorites.html`
- `src/main/resources/static/companion/dashboard.html`

## Compatibility

- Không còn để file role bên ngoài thư mục role.
- `static/index.html` là portal chung, `static/policy.html` là trang chung.

## Gợi ý chia task

- Team Admin: `controller.admin`, `service.admin`, `static/admin`
- Team User: `controller.user`, `service.user`, `static/user`
- Team Companion: `controller.companion`, `service.companion`, `static/companion`
