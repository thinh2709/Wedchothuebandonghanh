# Bộ 40 test case (UI) — hướng tự động hóa Playwright

Tài liệu này gom **40 kịch bản kiểm thử giao diện** cho ứng dụng **Companion Rental** (Spring Boot + static HTML/JS), phục vụ viết prompt / triển khai **Playwright** sau này.

## Mục đích

- Chuẩn hóa **ID**, **điều kiện tiên quyết**, **bước thao tác (UI)**, **kết quả mong đợi**, **dữ liệu test**.
- Tránh phụ thuộc vào tên kỹ thuật trong bước tester (ưu tiên nhãn/nút trên màn hình).

## Gợi ý khi triển khai Playwright

- **Base URL**: mặc định app `http://localhost:8080` (xem `application.properties`).
- **Biến môi trường**: `TEST_USER`, `TEST_PASS`, (tuỳ chọn) `TEST_ADMIN_USER`, `TEST_ADMIN_PASS`, tài khoản companion, tài khoản bị khóa/cảnh báo — **tách khỏi code**.
- **Phiên đăng nhập**: dùng `storageState` sau một lần login để chạy nhanh các test cần session; test “chưa đăng nhập” dùng **context mới** hoặc **incognito**.
- **Locator**: ưu tiên `getByRole`, `getByLabel`, `getByText` theo đúng chữ trên UI.
- **Dữ liệu phụ thuộc DB**: một số case cần **user/đơn/booking** có sẵn (ví dụ ví, đánh giá, lọc khu vực) — nên có **seed data** hoặc **tài khoản test cố định** trong tài liệu môi trường.

---

## Nhóm A — Đăng nhập (10)

| ID | Items | Sub-items | Description | PreCondition | Steps to Excute | Expected output | Test Data/ Parameters |
|----|--------|-----------|-------------|--------------|-----------------|-----------------|------------------------|
| LG-01 | Đăng nhập | Thành công (khách) | Đúng tên + mật khẩu khách → vào trang chủ | Tài khoản khách hoạt động | 1. Mở trang **Đăng nhập**. 2. Nhập **Tên đăng nhập**. 3. Nhập **Mật khẩu**. 4. Bấm **Đăng nhập**. 5. Chờ chuyển trang. | Vào **Trang chủ** user; menu hiển thị tên người dùng; không lỗi đỏ. | user/pass khách |
| LG-02 | Đăng nhập | Sai mật khẩu | Đúng tên, sai mật khẩu | User tồn tại | 1. Mở **Đăng nhập**. 2. Nhập đúng tên. 3. Nhập mật khẩu sai. 4. Bấm **Đăng nhập**. | Ở lại trang đăng nhập; thông báo **Sai tên đăng nhập hoặc mật khẩu**. | mật khẩu sai |
| LG-03 | Đăng nhập | Sai tên | User không tồn tại | — | 1. Mở **Đăng nhập**. 2. Nhập tên không có trong hệ thống. 3. Nhập mật khẩu bất kỳ. 4. Bấm **Đăng nhập**. | Thông báo **Sai tên đăng nhập hoặc mật khẩu**. | username giả |
| LG-04 | Đăng nhập | Tài khoản khóa | User bị khóa | `locked = true` | 1. Mở **Đăng nhập**. 2. Nhập đúng tên/mật khẩu tài khoản bị khóa. 3. Bấm **Đăng nhập**. | Thông báo **Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.** | user test khóa |
| LG-05 | Đăng nhập | Tài khoản cấm | User bị cấm | `BANNED` | 1–3 như LG-04. | Cùng thông báo khóa như LG-04 (theo backend hiện tại). | user test cấm |
| LG-06 | Đăng nhập | Cảnh báo | User bị cảnh báo | `WARNED` | 1. Đăng nhập đúng. 2. Quan sát thông báo. 3. Chờ chuyển trang. | Có **cảnh báo** chính sách; sau đó vẫn vào app (có thể trễ ~1s). | user cảnh báo |
| LG-07 | Đăng nhập | Có hồ sơ Companion | User có companion | Đã có companion | 1. Đăng nhập tài khoản có companion. | Chuyển **Dashboard Companion** (không phải trang chủ khách). | user có companion |
| LG-08 | Đăng nhập | Admin | Đăng nhập quản trị | Có tài khoản ADMIN | 1. Đăng nhập admin. | Vào **dashboard admin**. | admin user/pass |
| LG-09 | Đăng nhập | Ô trống | Thiếu tên hoặc mật khẩu | — | 1. Để trống một trong hai ô. 2. Bấm **Đăng nhập**. | Trình duyệt chặn (required) hoặc không gửi. | — |
| LG-10 | Đăng nhập | Đăng xuất | Sau login, logout | Đã login | 1. Bấm **Thoát/Đăng xuất**. 2. Vào trang cần login. | Về trang chủ/không còn session; yêu cầu đăng nhập lại. | — |

---

## Nhóm B — Tìm kiếm & bộ lọc nâng cao (10)

Trang: **Tìm kiếm bạn đồng hành** — các ô: **Từ khóa**, **Dịch vụ**, **Khu vực**, **Giới tính**, **Giá từ**, **Giá đến**, **Online?**, nút **Lọc**.

| ID | Items | Sub-items | Description | PreCondition | Steps to Excute | Expected output | Test Data/ Parameters |
|----|--------|-----------|-------------|--------------|-----------------|-----------------|------------------------|
| SE-01 | Search | Lọc trống | Bấm Lọc không nhập gì | Có companion hiển thị | Để tất cả trống/Tất cả → **Lọc**. | Vẫn có danh sách; không có **Không tìm thấy kết quả phù hợp** nếu server có dữ liệu. | — |
| SE-02 | Search | Từ khóa | Lọc theo tên/mô tả/sở thích | Có thẻ kết quả | Nhập từ xuất hiện trên thẻ (thử hoa thường) → **Lọc**. | Mọi thẻ còn lại đều chứa từ khóa trong phần hiển thị. | từ lấy từ thẻ |
| SE-03 | Search | Dịch vụ | Chọn Outing | Có companion Outing | 1. **Dịch vụ** = Outing. 2. **Lọc**. | Badge dịch vụ trên thẻ khớp Outing. | Outing |
| SE-04 | Search | Khu vực | Nhập một phần khu vực | Có badge khu vực | Nhập substring của **Khu vực** trên một thẻ → **Lọc**. | Kết quả chứa đúng phần khu vực. | substring |
| SE-05 | Search | Giới tính | Nam hoặc Nữ | Có dữ liệu | Chọn **Giới tính** → **Lọc** → **Xem profile** 1–2 thẻ. | Giới tính trên profile khớp lựa chọn. | Nam / Nữ |
| SE-06 | Search | Online | Đang online | Có companion online | **Online?** = Đang online → **Lọc**. | Mọi thẻ hiển thị nhãn **Online**. | online |
| SE-07 | Search | Offline | Đang offline | Có companion offline | **Online?** = Đang offline → **Lọc**. | Mọi thẻ hiển thị **Offline**. | offline |
| SE-08 | Search | Giá từ | Chỉ min | Có dữ liệu giá | Nhập **Giá từ** → **Lọc**. | Badge giá trên thẻ phù hợp điều kiện “từ”. | minPrice |
| SE-09 | Search | Giá đến | Chỉ max | Có dữ liệu | Nhập **Giá đến** → **Lọc**. | Badge giá phù hợp điều kiện “đến”. | maxPrice |
| SE-10 | Search | Kết hợp / không có kết quả | Nhiều bộ lọc hoặc tổ hợp không giao | Có dữ liệu | Chọn **Dịch vụ** + **Online** + **Khu vực** (và/hoặc giá) để tạo tổ hợp không có ai. | **Không tìm thấy kết quả phù hợp.** | tổ hợp tùy DB |

---

## Nhóm C — Ví tiền (10)

Trang **Ví** — **Số dư ví**, **Số tiền nạp**, **Kênh nạp** (MoMo / VNPay / Chuyển khoản), nút **Nạp tiền**, **Lịch sử giao dịch**.

| ID | Items | Sub-items | Description | PreCondition | Steps to Excute | Expected output | Test Data/ Parameters |
|----|--------|-----------|-------------|--------------|-----------------|-----------------|------------------------|
| WAL-01 | Ví | Hiển thị số dư | Số dư đúng định dạng | Đã đăng nhập | Mở **Ví** → đọc **Số dư ví**. | Hiển thị số + **VND** (định dạng hàng nghìn). | — |
| WAL-02 | Ví | Chưa có giao dịch | Bảng rỗng | User chưa có giao dịch ví | Mở **Ví** → xem **Lịch sử giao dịch**. | Dòng **Chưa có giao dịch.** | — |
| WAL-03 | Ví | Nạp thành công | Nạp hợp lệ | Đã login; có thể nạp | Đọc số dư → nhập **Số tiền nạp** → chọn **Kênh nạp** → **Nạp tiền**. | Thông báo **Nạp tiền thành công**; số dư tăng; dòng DEPOSIT mới. | 50000 VND; MoMo |
| WAL-04 | Ví | Kênh nạp | Đúng kênh trong lịch sử | Đã login | Nạp với **VNPay** rồi **Chuyển khoản** (hai lần). | Cột **Kênh** khớp từng lần. | 10000 × 2 |
| WAL-05 | Ví | Min/step | Nhập 500 và 1500 | Đã login | Nhập 500 → **Nạp tiền**; sau đó 1500 → **Nạp tiền**. | 500: không nạp thành công (hoặc bị chặn). 1500: ghi nhận theo browser. | 500; 1500 |
| WAL-06 | Ví | 0 / trống | Không nạp được | Đã login | Để trống số tiền → **Nạp**; nhập **0** → **Nạp**. | Trống: chặn. 0: lỗi / không thành công. | — |
| WAL-07 | Ví | Chưa đăng nhập | Truy cập Ví | Chưa đăng nhập | Mở trang **Ví** (ẩn danh). | Chuyển **Đăng nhập**. | — |
| WAL-08 | Ví | Đồng bộ sau nạp | Sau nạp, dữ liệu cập nhật | Đã login | Nạp một số tiền → quan sát số dư và lịch sử. | Số dư và lịch sử khớp giao dịch. | 20000 |
| WAL-09 | Ví | Sau đăng xuất | Không xem ví khi đã thoát | Đã login, đang ở Ví | **Đăng xuất** → mở lại **Ví**. | Chuyển **Đăng nhập**. | — |
| WAL-10 | Ví | Hiển thị mobile | Bảng lịch sử trên màn nhỏ | Đã login; có giao dịch | Thu nhỏ viewport → xem **Lịch sử giao dịch**. | Bảng cuộn/xem được; màu số dương/âm (nếu có). | — |

---

## Nhóm D — Đánh giá (10)

Trang **Đánh giá** — **Lịch hẹn đã hoàn thành**, **Số sao**, **Nhận xét**, **Gửi đánh giá**, khối **Đánh giá của bạn**.

| ID | Items | Sub-items | Description | PreCondition | Steps to Excute | Expected output | Test Data/ Parameters |
|----|--------|-----------|-------------|--------------|-----------------|-----------------|------------------------|
| RV-01 | Đánh giá | Mở trang | Hai khối form + danh sách | Đã đăng nhập | Mở **Đánh giá** từ menu. | Thấy **Gửi đánh giá** và **Đánh giá của bạn**. | — |
| RV-02 | Đánh giá | Chưa đăng nhập | Redirect | Chưa login | Mở trang Đánh giá (ẩn danh). | Chuyển **Đăng nhập**. | — |
| RV-03 | Đánh giá | Chỉ đơn **COMPLETED** | Dropdown chỉ lịch đã hoàn thành | Có đơn mixed | Mở **Lịch hẹn đã hoàn thành** → so với màn Lịch hẹn. | Chỉ đơn hoàn thành xuất hiện. | — |
| RV-04 | Đánh giá | Không có đơn hoàn thành | Không gửi được | Không có đơn COMPLETED | Chọn dòng “không có…” / để trống → **Gửi đánh giá**. | Cảnh báo cần lịch **đã hoàn thành**. | — |
| RV-05 | Đánh giá | Gửi thành công | Lần đầu cho một đơn | Có đơn COMPLETED chưa review | Chọn đơn → sao → nhận xét → **Gửi đánh giá**. | **Gửi đánh giá thành công**; thẻ mới trong **Đánh giá của bạn**. | nhận xét mẫu |
| RV-06 | Đánh giá | Chọn số sao | 3 sao | Có đơn chưa review | Bấm sao thứ 3 → gửi. | Hiển thị ★★★ (3 sao). | 3 sao |
| RV-07 | Đánh giá | Nhận xét trống | Cho phép gửi không comment | Có đơn chưa review | Bỏ trống **Nhận xét** → **Gửi**. | Thành công (comment có thể trống). | sao cố định |
| RV-08 | Đánh giá | Không gửi trùng | Một đơn một lần | Đã đánh giá đơn X | Thử gửi lại cho cùng đơn. | Thất bại; không trùng bản ghi. | — |
| RV-09 | Đánh giá | Danh sách đã gửi | Hiển thị đúng | Có ≥1 đánh giá | Đọc **Đánh giá của bạn** từ trên xuống. | Có mã đơn, sao, thời gian, nội dung. | — |
| RV-10 | Đánh giá | Mobile | Responsive | Đã login | Thu nhỏ màn hình → thao tác form + danh sách. | Không vỡ layout; cuộn được. | ~375px |

---

## Nhận xét: dùng Playwright cho bộ 40 case này có hợp lý không?

**Hợp lý và phù hợp** với kiểu ứng dụng hiện tại (HTML tĩnh + JS, gọi API cùng origin, session cookie):

- **Ưu điểm**
  - Mô phỏng đúng hành vi người dùng (điền form, bấm **Lọc / Nạp tiền / Gửi đánh giá**).
  - Dễ gắn **trace** / screenshot khi fail.
  - Tách được test **cần đăng nhập** vs **không login** bằng `browser.newContext()`.
  - Có thể kết hợp **`request` fixture** để kiểm tra API (tuỳ chọn) mà không phải lặp lại toàn bộ UI.

- **Hạn chế / cần chuẩn bị**
  - **Dữ liệu phụ thuộc DB**: ví, đánh giá, lọc khu vực, tài khoản bị khóa — cần **môi trường test ổn định** (seed script hoặc tài khoản cố định), nếu không test sẽ **flake** (lúc pass lúc fail).
  - **Thứ tự test**: ví và đánh giá thay đổi dữ liệu — nên **cô lập** (mỗi test tự tạo user/đơn) hoặc chạy trên DB reset hoặc dùng **parallel=false** cho nhóm “có side effect”.
  - **Đồng hồ / thời gian**: đăng nhập cảnh báo có delay ngắn — cần `expect` có **timeout** hoặc `waitForURL` thay vì `sleep` cố định.

**Kết luận**: Playwright là **lựa chọn hợp lý** cho E2E smoke/regression của 40 case này, miễn là team dành **1–2 ngày** để: (1) chuẩn hóa **test data**, (2) cấu hình **CI** (chạy app + seed), (3) tách test **read-only** (search) và test **ghi dữ liệu** (ví/review).

---

## Phiên bản tài liệu

- Tạo để tái sử dụng prompt / triển khai Playwright.
- Nội dung bám theo code trong repo tại thời điểm biên soạn (UI + luồng đặc tả trong `UserController`, `WalletController`, `ReviewController`, `CompanionController`, `user.js`, các trang `user/*.html`).
