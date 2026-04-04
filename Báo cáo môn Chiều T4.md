**CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI** 

 

**1.1. Giới thiệu dự án**

Dự án **"Website cho thuê bạn đồng hành"** được xây dựng nhằm cung cấp một nền tảng trực tuyến an toàn, minh bạch, giúp kết nối khách hàng với những người bạn đồng hành phù hợp với sở thích và yêu cầu cá nhân. 

1.2 Các chức năng của ứng dụng.

* **Đăng ký/Đăng nhập:** Tạo và quản lý tài khoản cá nhân.   
* **Đăng ký tham gia companion:** Đăng ký trở thành bạn đồng hành, cần admin duyệt đơn đăng ký.  
* **Tìm kiếm & Bộ lọc nâng cao:** Tìm kiếm theo vị trí địa lý, sở thích, ngoại hình, ngôn ngữ...   
* **Xem hồ sơ chi tiết:** Xem thông tin, hình ảnh và đánh giá của Bạn đồng hành.   
* **Hệ thống Đặt lịch:** Chọn thời gian và loại hình dịch vụ.   
* **Quản lý lịch hẹn:** Theo dõi trạng thái lịch đã đặt (Chờ duyệt, Đã xác nhận, Hoàn thành).   
* **Đánh giá & Tố cáo:** Phản hồi chất lượng dịch vụ hoặc báo cáo vi phạm.   
* **Xử lý yêu cầu:** Chấp nhận hoặc từ chối các yêu cầu đặt lịch từ khách hàng.   
* **Thống kê thu nhập:** Theo dõi số tiền nhận được theo tháng/quý.   
* **Chat:** Trao đổi trực tiếp với khách hàng để thống nhất công việc.   
* **Kiểm duyệt hồ sơ:** Xác minh tính xác thực của các tài khoản Bạn đồng hành.   
* **Quản lý giao dịch:** Theo dõi các dòng tiền và xử lý tranh chấp nếu có.   
* **Quản lý bảng giá:** Cấu hình mức giá trần/sàn cho các loại hình dịch vụ.   
* **Thống kê & Báo cáo:** Theo dõi doanh thu tổng thể và biểu đồ tăng trưởng người dùng.   
* **Theo dõi hành trình:** Giám sát trạng thái các cuộc hẹn đang diễn ra để đảm bảo an toàn. 

1.3 Các chức năng được lựa chọn để thiết kế testcase

* Chức năng Đăng nhập  
* Chức năng Tìm kiếm & Bộ lọc nâng cao  
* Chức năng Đánh giá (Review)  
* Chức năng Nạp Ví


**CHƯƠNG 2**   
https://docs.google.com/spreadsheets/d/1S1sYY7dK20b-6d-5znt\_zdQkz3uD3ZdSvFYKbRkvFHM/edit?gid=968024027\#gid=968024027

**CHƯƠNG 3** 

**CHƯƠNG 3: ÁP DỤNG THIẾT KẾ TESTCASE BLACK BOX** 

**3.1. Chức năng Đăng nhập** 

**1\. Mô tả yêu cầu:** Người dùng truy cập vào hệ thống bằng tài khoản đã đăng ký. Hệ thống yêu cầu: 

* **Tên đăng nhập:** Không được để trống.   
* **Mật khẩu:** Phải trùng khớp với dữ liệu trong hệ thống.   
* **Thông báo lỗi:** Nếu sai thông tin, hiển thị banner đỏ thông báo "Sai tên đăng nhập hoặc mật khẩu" (như ảnh demo). 

**2\. Phân tích (Kỹ thuật: Phân vùng tương đương):** 

* **Tên đăng nhập:** {Đúng}, {Sai/Không tồn tại}, {Để trống}.   
* **Mật khẩu:** {Đúng}, {Sai}, {Để trống}.   
* **Trạng thái hiển thị:** Hiển thị mật khẩu (icon mắt) và thông báo lỗi banner. 

**3\. Danh sách Testcase:** 

| ID  | Mô tả Testcase  | Dữ liệu đầu vào (Input Data)  | Kết quả mong đợi  |
| :---: | :---: | :---: | :---: |
| TC01  | Đăng nhập thành công  | Tên: user\_chuan;   Mật khẩu: 123456 (đúng).  | Đăng nhập thành công, chuyển về trang chủ.  |
| TC02  | Đăng nhập sai thông tin  | Tên: user3;   Mật khẩu: 1234 (sai).  | Hiển thị banner đỏ: "Sai tên đăng nhập hoặc mật khẩu".  |
| TC03  | Để trống tên đăng nhập  | Tên: (Trống);   Mật khẩu: 123456\.  | Hệ thống báo lỗi yêu cầu nhập tên đăng nhập.  |
| TC04  | Để trống mật khẩu  | Tên: user\_chuan;   Mật khẩu: (Trống).  | Hệ thống báo lỗi yêu cầu nhập mật khẩu.  |
| TC05  | Kiểm tra chức năng ẩn/hiện mật khẩu  | Nhập mật khẩu;   Click icon "mắt".  | Mật khẩu chuyển đổi giữa dạng dấu chấm (hidden) và văn bản (plain text).  |

 

       

**3.2. Chức năng Tìm kiếm & Bộ lọc nâng cao** 

**1\. Mô tả yêu cầu:** Hệ thống cho phép khách hàng tìm kiếm Bạn đồng hành thông qua bộ lọc đa điều kiện. Kết quả trả về phải thỏa mãn đồng thời các tiêu chí được chọn. Các trường dữ liệu bao gồm: 

* **Từ khóa:** Tên hoặc sở thích (Text).   
* **Dịch vụ & Giới tính:** Chọn từ danh sách có sẵn (Dropdown).   
* **Khu vực:** Nhập địa điểm (Text/Autocomplete).   
* **Khoảng giá:** Giá từ \- Giá đến (Số).   
* **Online?:** Trạng thái hoạt động (Dropdown). 

**2\. Phân tích (Kỹ thuật: Phân vùng tương đương & Giá trị biên):** 

* **Từ khóa:** {Có tồn tại}, {Không tồn tại}, {Trống}.   
* **Khoảng giá:** Biên dưới 100.000đ, Biên trên 2.000.000đ.   
* **Logic kết hợp:** Kiểm tra khi chọn tất cả các trường và khi chỉ chọn một vài trường.   
     
  **3\. Danh sách Testcase:** 

| ID  | Mô tả Testcase  | Dữ liệu đầu vào (Input)  | Kết quả mong đợi  |
| :---: | :---: | :---: | :---: |
| TC05  | Lọc kết hợp tất cả điều kiện  | Từ khóa: "An"; Dịch vụ: Du lịch; Khu vực: HN; Giới tính: Nam; Giá: 200k-500k; Online: Có.  | Hiển thị danh sách khớp toàn bộ điều kiện.  |
| TC06  | Lọc theo Khu vực và Giới tính  | Khu vực: HCM; Giới tính: Nữ; Các trường khác: Tất cả/Trống.  | Hiển thị tất cả Bạn đồng hành Nữ tại HCM.  |
| TC07  | Kiểm tra biên dưới của giá  | Giá từ: 100.000; Các trường khác: Mặc định.  | Hiển thị danh sách chính xác từ 100.000đ.  |
| TC08  | Kiểm tra lỗi giá dưới biên  | Giá từ: 99.000; Các trường khác: Trống.  | Thông báo: "Giá tối thiểu từ 100.000đ".  |
| TC09  | Kiểm tra lỗi giá vượt biên  | Giá đến: 2.001.000; Các trường khác: Trống.  | Thông báo: "Giá tối đa là 2.000.000đ".  |
| TC10  | Tìm kiếm không có kết quả  | Từ khóa: "Không tồn tại 123"; Các trường khác: Trống.  | Hiển thị: "Không tìm thấy kết quả phù hợp".  |

 

 

**3.3. Chức năng Gửi yêu cầu đặt lịch** 

**1\. Mô tả yêu cầu:** Khách hàng thực hiện đặt lịch với Bạn đồng hành bằng cách chọn dịch vụ, thời gian và địa điểm. Hệ thống yêu cầu: 

* **Thời gian bắt đầu:** Phải là thời gian ở tương lai.   
* **Địa điểm gặp:** Nếu chọn "Thêm địa điểm gặp", phải nhập đầy đủ số nhà, Tỉnh/Thành và Quận/Huyện.   
* **Ảnh mô tả:** Chỉ hỗ trợ định dạng jpg, png, webp. 

**2\. Phân tích (Kỹ thuật: Bảng quyết định & Phân vùng tương đương):** 

* **Vùng thời gian:** {Tương lai}, {Quá khứ}.   
* **Vùng địa điểm:** {Đầy đủ thông tin}, {Thiếu Tỉnh/Thành hoặc Quận/Huyện}.   
* **Vùng ảnh:** {Đúng định dạng}, {Sai định dạng (pdf, docx...)}. 

**3\. Danh sách Testcase:** 

 

 

| ID  | Mô tả Testcase  | Dữ liệu đầu vào (Input Data)  | Kết quả mong đợi  |
| :---: | :---: | :---: | :---: |
| TC11  | Đặt lịch thành công với các thông tin hợp lệ  | Companion: Khoa; Dịch vụ: Đồng hành; Thời gian: 05/01/2026 (Tương lai); Địa điểm: Trống; Ghi chú: "Hẹn gặp bạn".  | Gửi yêu cầu thành công, hiển thị thông báo chờ duyệt.  |
| TC12  | Lỗi thời gian bắt đầu ở quá khứ  | Thời gian: 01/01/2026 (Đã qua); Các trường khác: Hợp lệ.  | Thông báo: "Thời gian bắt đầu không được ở quá khứ".  |
| TC13  | Lỗi thiếu thông tin địa điểm gặp  | Thêm địa điểm: Bật; Số nhà: 12 Nguyễn Huệ; Tỉnh/Thành: Để trống.  | Thông báo: "Vui lòng chọn Tỉnh/Thành phố".  |
| TC14  | Kiểm tra tải lên ảnh sai định dạng  | Ảnh mô tả: Chọn file tailieu.pdf; Các trường khác: Hợp lệ.  | Thông báo: "Định dạng file không hỗ trợ (chỉ jpg, png, webp)".  |
| TC15  | Đặt lịch với thời lượng thuê tối thiểu  | Thời lượng thuê: 60 phút; Các trường khác: Hợp lệ.  | Gửi yêu cầu thành công, tính phí cọc đúng 1 giờ.  |
| TC16  | Để trống trường bắt buộc  | Nơi thuê: Để trống; Các trường khác: Hợp lệ.  | Thông báo: "Vui lòng chọn nơi thuê".  |

 

**3.4. Chức năng Đánh giá (Review)** 

**1\. Mô tả yêu cầu:** Sau khi kết thúc dịch vụ, khách hàng chọn lịch hẹn tương ứng để thực hiện đánh giá. Hệ thống yêu cầu: 

* **Lịch hẹn:** Phải chọn từ danh sách các lịch đã có trạng thái "Hoàn thành".   
* **Số sao:** Mặc định từ 1 đến 5 sao.   
* **Nhận xét:** Nội dung tối thiểu 10 ký tự và tối đa 200 ký tự để đảm bảo chất lượng đánh giá. 

**2\. Phân tích (Kỹ thuật: Phân vùng tương đương):** 

* **Trạng thái lịch hẹn:** {Đã hoàn thành}, {Chưa hoàn thành/Không có lịch}.   
* **Số sao:** {Đã chọn (1-5)}, {Chưa chọn}.   
* **Độ dài nhận xét:** {Dưới 10 ký tự}, {Từ 10-200 ký tự}, {Trên 200 ký tự}. 

**3\. Danh sách Testcase:** 

| ID  | Mô tả Testcase  | Dữ liệu đầu vào (Input Data)  | Kết quả mong đợi  |
| :---: | :---: | :---: | :---: |
| TC17  | Gửi đánh giá thành công  | Lịch hẹn: LH001 (Hoàn thành); Số sao: 5; Nhận xét: "Bạn rất nhiệt tình, đúng giờ".  | Gửi thành công, hiển thị tại mục "Đánh giá của bạn".  |
| TC18  | Lỗi khi chưa chọn lịch hẹn  | Lịch hẹn: "Không có lịch hẹn đã hoàn thành"; Số sao: 5; Nhận xét: "Tốt".  | Nút "Gửi đánh giá" bị vô hiệu hóa hoặc báo lỗi chọn lịch.  |
| TC19  | Kiểm tra độ dài nhận xét quá ngắn  | Lịch hẹn: LH001; Số sao: 4; Nhận xét: "Tốt" (4 ký tự).  | Thông báo: "Nhận xét phải có ít nhất 10 ký tự".  |
| TC20  | Kiểm tra độ dài nhận xét quá dài  | Lịch hẹn: LH001; Số sao: 3; Nhận xét: (Đoạn văn \> 200 ký tự).  | Thông báo: "Nhận xét không được vượt quá 200 ký tự".  |
| TC21  | Gửi đánh giá khi chưa chọn số sao  | Lịch hẹn: LH001; Số sao: 0; Nhận xét: "Dịch vụ ổn, sẽ quay lại".  | Thông báo: "Vui lòng chọn số sao đánh giá".  |

**CHƯƠNG 4** : KIỂM THỬ WHITE BOX – PHÂN TÍCH MÃ NGUỒN VÀ ĐỘ PHỦ  
4.1 **Chức năng Đăng nhập** 

## **4.1.1 Chức Năng Đăng Nhập** 

Chức năng đăng nhập, các nhánh rẽ và điều kiện được đánh số Node để dễ dàng tham chiếu trong các test case.

@PostMapping("/login")  
public Map\<String, Object\> login(@RequestBody Map\<String, String\> request, HttpSession session) {  
    String username \= request.get("username");  
    String password \= request.get("password");

    **// \[Node 1\]: Tìm user trong CSDL**  
    Optional\<User\> user \= userService.login(username, password);  
    Map\<String, Object\> response \= new HashMap\<\>(); 

    **// \[Node 2\]: Kiểm tra User có tồn tại không?**  
    if (user.isPresent()) {   
        User u \= user.get();  
**// \[Node 3\]: Kiểm tra User có bị khóa không?**  
        if (Boolean.TRUE.equals(u.getLocked())) {   
    **// \[Node 4\]: Kiểm tra xem đã hết hạn khóa chưa? (Chứa 2 mệnh đề điều kiện)**  
            if (u.getLockedUntil() \!= null && u.getLockedUntil().isBefore(java.time.LocalDateTime.now())) {   
    **// \[Node 5\]: Tự động mở khóa**  
                u.setLocked(false);   
                u.setLockedUntil(null);  
                userRepository.save(u);  
            } else {  
    **// \[Node 6\]: Chặn đăng nhập vì đang bị khóa**  
                response.put("success", false);   
                response.put("isLocked", true);  
                response.put("message", "Tài khoản của bạn đã bị khóa. Vui lòng gửi khiếu nại nếu cho rằng đây là nhầm lẫn.");  
                return response;  
            }  
        }  
        **// \[Node 7\]: Kiểm tra User có bị Cấm vĩnh viễn không?**  
        if (User.ModerationFlag.BANNED.equals(u.getModerationFlag())) {   
            **// \[Node 8\]: Chặn đăng nhập vì BANNED**  
            response.put("success", false);   
            response.put("isLocked", true);  
            response.put("message", "Tài khoản đã bị cấm. Vui lòng gửi khiếu nại hoặc liên hệ quản trị viên.");  
            return response;  
        }  
        **// \[Node 9\]: Kiểm tra User có bị Cảnh cáo không?**  
        if (User.ModerationFlag.WARNED.equals(u.getModerationFlag())) {   
            **// \[Node 10\]: Đính kèm thông báo cảnh báo**  
            response.put("warning", true);   
            response.put("warningMessage", "Tài khoản của bạn đang ở trạng thái cảnh báo...");  
        }  
    **// \[Node 11\]: Toán tử 3 ngôi (Ternary Branch) kiểm tra Companion**  
        String effectiveRole \= companionRepository.findByUserId(user.get().getId()).isPresent()   
                ? "COMPANION" // **\[Node 12\]**   
                : user.get().getRole().name(); // **\[Node 13\]**  
          
        **// \[Node 14\]: Đăng nhập thành công, thiết lập Session**  
        session.setAttribute("userId", user.get().getId());   
        session.setAttribute("username", user.get().getUsername());  
        session.setAttribute("role", effectiveRole);  
          
        response.put("success", true);  
        response.put("userId", user.get().getId());  
        response.put("username", user.get().getUsername());  
        response.put("role", effectiveRole);  
          
        **// \[Node 15\]: Trả về kết quả thành công**  
        return response;   
    } else {  
        **// \[Node 16\]: Sai User/Password**  
        response.put("success", false);   
        response.put("message", "Sai tên đăng nhập hoặc mật khẩu");  
        **// \[Node 17\]: Trả về kết quả thất bại**  
        return response;   
    }  
}

4.1.2 **Danh sách Testcase**

| ID | Kịch bản kiểm thử | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Output) | Loại bao phủ (Coverage) | Đường dẫn (Code Path Execution) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **TC01** | **Sai tài khoản/mật khẩu: User không tồn tại hoặc sai thông tin.** | **user.isPresent \== false**  | **success: false message: "Sai tên..."** | **Phủ nhánh (Branch)** | **Đi thẳng vào nhánh Else (Node 1 \-\> Node 2 \-\> Node 16 \-\> Node 17\)** |
| **TC02** | **Account khóa không thời hạn: User bị locked nhưng null khóa.** | **isPresent=true, locked=true, lockedUntil=null** | **success: false, isLocked: true** | **Phủ điều kiện (Condition)** | **Node 1, 2, 3, 4 (điều kiện đầu trả False) \-\> Node 6** |
| **TC03** | **Account đang bị khóa có hạn: User bị locked và thời hạn chưa tới.** | **isPresent=true, locked=true, lockedUntil \= Tương lai** | **success: false, isLocked: true** | **Phủ điều kiện (Condition)** | **Node 1, 2, 3, 4 (đk 1 True, đk 2 False) \-\> Node 6** |
| **TC04** | **Giải khóa tự động (Unlock): User bị khóa nhưng đã qua thời hạn.** | **isPresent=true, locked=true, lockedUntil \= Quá khứ, role=CUSTOMER** | **Giải khóa (Lưu DB), success: true** | **Phủ nhánh & Điều kiện** | **Node 1, 2, 3, 4 (Cả 2 đk True) \-\> Node 5 \-\> 7, 9, 11, 13 \-\> Node 15** |
| **TC05** | **Tài khoản bị cấm: Trạng thái BANNED vĩnh viễn.** | **isPresent=true, locked=false, modFlag=BANNED** | **success: false, message: "Tài khoản đã bị cấm..."** | **Phủ đường (Path)** | **Node 1, 2, 3 (False), 7 (True) \-\> Node 8** |
| **TC06** | **Kiểm thử ưu tiên luồng code (Early Return): User vừa bị Khóa (Locked) vĩnh viễn vừa bị cờ BANNED.** | **isPresent=true, locked=true, lockedUntil=null, modFlag=BANNED** | **success: false, message: "Tài khoản của bạn đã bị khóa..." (Không tới được đoạn BANNED)** | **Phủ nhánh (Branch / Early Return)** | **Node 1, 2, 3 (True), 4 (False) \-\> Node 6 (Thoát hàm ngay tại đây, bỏ qua Node 7, 8\)** |
| **TC07** | **Tài khoản thường \- Có Cảnh cáo (WARNED): Bị cảnh cáo nhưng không là Companion.** | **isPresent=true, locked=false, modFlag=WARNED, companion=null** | **success: true, warning: true, role=CUSTOMER** | **Phủ đường (Path)** | **Node 1, 2, 3 (False), 7 (False), 9 (True) \-\> Node 10 \-\> Node 11, 13, 14, 15** |
| **TC08** | **Tài khoản là Companion: Ghi nhận role ưu tiên bằng toán tử.** | **isPresent=true, locked=false, modFlag=NORMAL, companion=exist** | **success: true, role=COMPANION** | **Phủ nhánh (Toán tử 3 ngôi)** | **Node 1, 2, 3 (False), 7 (False), 9 (False) \-\> Node 11, 12 \-\> Node 14, 15** |
| **TC09** | **Companion bị WARNED: Companion vẫn có thể bị WARNED.** | **isPresent=true, locked=false, modFlag=WARNED, companion=exist** | **success: true, warning: true, role=COMPANION** | **Luồng tổng hợp** | **Node 1, 2, 3, 7, 9 (True) \-\> 10 \-\> 11 (True) \-\> 12 \-\> 14 \-\> 15** |
| **TC10** | **Đăng nhập hợp lệ chuẩn (Happy Path): Mọi thứ bình thường.** | **isPresent=true, locked=false, modFlag=NORMAL, companion=null, role=CUSTOMER** | **success: true, role=CUSTOMER** | **Phủ đường (Path) \- Nhấn mạnh Happy Path** | **Node 1, 2, 3(False), 7(False), 9(False) \-\> 11 \-\> 13 \-\> 14 \-\> 15** |

**Dựa vào cấu trúc phân tích White Box trong mục 4.2 và 4.3, tôi đã bổ sung các phần phân tích Đồ thị dòng điều khiển (CFG) và Độ phức tạp Cyclomatic cho mục 4.1.**

**Dưới đây là nội dung bổ sung cho mục 4.1:4.1.3 Đồ thị dòng điều khiển (Control Flow Graph \- CFG) và Phân tích:**

**Cấu trúc luồng điều khiển của hàm** `login` bao gồm các node rẽ nhánh độc lập sau:

* **Node 2:** Kiểm tra tài khoản có tồn tại/đúng mật khẩu hay không.  
* **Node 3:** Kiểm tra tài khoản có bị khóa tạm thời (`locked=true`) không.  
* **Node 4:** Kiểm tra 2 điều kiện độc lập để Tự động mở khóa (`lockedUntil != null` **VÀ** `lockedUntil.isBefore(now)`).  
* **Node 7:** Kiểm tra trạng thái cấm vĩnh viễn (`ModerationFlag.BANNED`).  
* **Node 9:** Kiểm tra trạng thái cảnh cáo (`ModerationFlag.WARNED`).  
* **Node 11:** Toán tử ba ngôi, xác định Role là `COMPANION` hay `CUSTOMER` (dựa trên sự tồn tại của Companion profile).

4.1.4 Tính độ phức tạp Cyclomatic:

Số điểm rẽ điều kiện độc lập (Predicates) trong mã nguồn: $P \= 7$ (Node 2, 3, 4a, 4b, 7, 9, 11).

**Độ phức tạp thuật toán:** $V(G) \= P \+ 1 \= 7 \+ 1 \= 8$.

**Tập đường dẫn cơ sở (cần 8 đường để đạt Branch Coverage):**

| Đường dẫn | Mô tả luồng | Các Node được kích hoạt | Testcase tương ứng |
| ----- | ----- | ----- | ----- |
| **Đường 1** | Sai tên đăng nhập/Mật khẩu | Node 1 → 2 (F) → 16 → 17 | TC01 |
| **Đường 2** | Tài khoản bị khóa (không tự động mở khóa) | Node 1 → 2 (T) → 3 (T) → 4 (F) → 6 | TC02, TC03, TC06 |
| **Đường 3** | Giải khóa tự động (Unlock) và đăng nhập | Node 1 → 2 (T) → 3 (T) → 4 (T) → 5 → 7 (F) → 9 (F) → 11 → 13 → 15 | TC04 |
| **Đường 4** | Tài khoản bị Cấm (BANNED) | Node 1 → 2 (T) → 3 (F) → 7 (T) → 8 | TC05 |
| **Đường 5** | Happy Path \- Customer bình thường | Node 1 → 2 (T) → 3 (F) → 7 (F) → 9 (F) → 11 → 13 → 15 | TC10 |
| **Đường 6** | Happy Path \- Companion bình thường | Node 1 → 2 (T) → 3 (F) → 7 (F) → 9 (F) → 11 → 12 → 15 | TC08 |
| **Đường 7** | Customer có Cảnh cáo (WARNED) | Node 1 → 2 (T) → 3 (F) → 7 (F) → 9 (T) → 10 → 11 → 13 → 15 | TC07 |
| **Đường 8** | Companion có Cảnh cáo (WARNED) | Node 1 → 2 (T) → 3 (F) → 7 (F) → 9 (T) → 10 → 11 → 12 → 15 | TC09 |

4.1.5 Đánh giá độ bao phủ (Coverage Evaluation):

**Kết luận:** Dựa trên 10 kịch bản kiểm thử trong mục 4.1.2, toàn bộ 8 đường dẫn cơ sở (Base Path) và mọi nhánh rẽ điều kiện độc lập trong mã nguồn đã được kích hoạt, đảm bảo đạt yêu cầu **Path Coverage 100%** và **Branch Coverage 100%** cho chức năng Đăng nhập.

4.2 **Chức năng Tìm kiếm & Bộ lọc nâng cao**   
**4.2.1 Mục đích chức năng: Kiểm tra các luồng thực thi (paths) khi khách hàng sử dụng bộ lọc tìm kiếm. Đảm bảo mọi nhánh xử lý logic của các tiêu chí lọc (Từ khóa, dịch vụ, khu vực, giới tính, trạng thái, khoảng giá) trong mã nguồn đều được thực thi ít nhất một lần.**  
**4.2.2** **Function validateSearchFilter**  
  boolean ok \= true;  
 if (\!q.isBlank()) { ... } // C1: Từ khóa  
 if (serviceType \!= null && \!serviceType.isBlank()) { ... } // C2: Dịch vụ  
 if (area \!= null && \!area.isBlank()) { ... } // C3: Khu vực  
 if (gender \!= null && \!gender.isBlank()) { ... } // C4: Giới tính  
 if (online \!= null) { ... } // C5: Trạng thái Online  
   
 if (minPrice \!= null && maxPrice \!= null) { // C6: Đủ 2 giá  
     ok \= ok && cMax.compareTo(minPrice) \>= 0 && cMin.compareTo(maxPrice) \<= 0;  
} else if (minPrice \!= null) { // C7: Chỉ có giá từ  
    ok \= ok && cMax.compareTo(minPrice) \>= 0;  
 } else if (maxPrice \!= null) { // C8: Chỉ có giá đến  
    ok \= ok && cMin.compareTo(maxPrice) \<= 0;  
}  
return ok;

**4.2.3 Đồ thị dòng điều khiển (Control Flow Graph \- CFG) và Phân tích:**

**Áp dụng gom cụm (macro-block), mỗi lệnh `if` là một Node quyết định:**

* **Node A (C1) \-\> Node E (C5): Các lệnh kiểm tra thông tin cơ bản.**  
* **Node F (C6): Lệnh kiểm tra có nhập đủ 2 khoảng giá.**  
* **Node G (C7): Lệnh `else if` kiểm tra chỉ có giá tối thiểu.**  
* **Node H (C8): Lệnh `else if` kiểm tra chỉ có giá tối đa.**  
* **Node I: Kết thúc, `return ok`.**

**4.2.4 Tính độ phức tạp Cyclomatic:**

* **Số node điều kiện rẽ nhánh ($P$) \= 8 (Gồm các Node A, B, C, D, E, F, G, H).**  
* **Độ phức tạp Cyclomatic: V(G) \= P \+ 1 \= 8 \+ 1 \= 9\.**  
  **\=\> Cần thiết kế 9 đường dẫn cơ sở (Path) để phủ toàn bộ luồng logic.**


**4.2.5 Bảng Testcase Phủ đường**  (Condition Coverage):  
Dựa vào mã nguồn Java và 9 đường dẫn cơ sở đã xác định, ta ánh xạ 10 kịch bản kiểm thử từ hệ thống để chứng minh toàn bộ các nhánh logic đều được thực thi. *(Ghi chú: **T** là thỏa mãn điều kiện `if` và chạy vào trong, **F** là không thỏa mãn và bỏ qua).*

| ID | Dữ liệu đầu vào (Input) | Nhánh đi qua (True) | Đường dẫn (Path) | Kết quả mong đợi |
| :---- | :---- | :---- | :---- | :---- |
| TC\_01 | Nhập đủ tất cả các trường | A, B, C, D, E, F | A(T) → B(T) → C(T) → D(T) → E(T) → F(T) → G | Trả về Companion khớp toàn bộ lọc. |
| TC\_02 | Chỉ nhập Area & Gender | C, D | A(F) → B(F) → C(T) → D(T) → E(F) → F(F) → G | Trả về Companion tại Area & Gender đó. |
| TC\_03 | Chỉ nhập minPrice \= 100k | G | A(F) → ... → F(F) → G(T) → I | Trả về Companion có cMax \>= 100k. |
| TC\_04 | Chỉ nhập minPrice \= 99k | G | A(F) → ... → F(F) → G(T) → I | Hệ thống báo lỗi giá tối thiểu (Frontend). |
| TC\_05 | Chỉ nhập maxPrice \= 2.001k | H | A(F) → ... → F(F) → G(F) → H(T) → I | Hệ thống báo lỗi giá tối đa (Frontend). |
| TC\_06 | keyword không tồn tại | A | A(T) → B(F) → ... → G | Biến ok thành false → Không có kết quả. |
| TC\_07 | min \= 500k \> max \= 200k | F | A(F) → ... → F(T) → I | cMax\>=500 & cMin\<=200 là vô lý → Rỗng. |
| TC\_08 | Để trống tất cả | Không có | A(F) → B(F) → C(F) → D(F) → E(F) → F(F) → G | Trả về toàn bộ danh sách (Default). |
| TC\_09 | Chỉ lọc Online | E | A(F) → ... → E(T) → F(F) → G | Trả về Companion đang Online. |
| TC\_10 | Chỉ lọc Dịch vụ | B | A(F) → B(T) → C(F) → ... → G | Trả về Companion có serviceType khớp. |

**Mọi câu lệnh điều kiện từ C1 đến C8 đều đã được kích hoạt trạng thái True (T) và False (F) ít nhất một lần.**

**Tập hợp 10 kịch bản kiểm thử đã bao phủ toàn bộ các đường dẫn thực thi cơ sở ($V(G)=9$).**  
**$\\Rightarrow$ Kết luận: Chức năng Tìm kiếm & Bộ lọc nâng cao đạt 100% độ bao phủ đường (Path Coverage). Mã nguồn xử lý chính xác và chặt chẽ các tổ hợp dữ liệu từ người dùng.**

4.3 Chức năng Đánh giá (Rate) bạn đồng hành  
4.3.1 Mô tả yêu cầu

Hệ thống cho phép khách hàng (Customer) gửi đánh giá (rating) cho bạn đồng hành gắn với một đơn đặt lịch (Booking) đã hoàn tất. Kết quả được chấp nhận chỉ khi thỏa tuần tự toàn bộ điều kiện nghiệp vụ trong tầng dịch vụ. Các trường dữ liệu đầu vào bao gồm:

\- bookingId: Định danh đơn cần đánh giá (số, bắt buộc; đơn phải tồn tại trong hệ thống).  
\- rating: Điểm sao từ 1 đến 5 (số nguyên).  
\- comment: Nhận xét tự do (có thể rỗng hoặc null — hệ thống vẫn lưu được).

Ràng buộc nghiệp vụ (đồng thời):

\- Chỉ chủ đơn (customer đăng nhập trùng \`booking.customer\`) mới được đánh giá đơn đó.  
\- Chỉ đơn ở trạng thái COMPLETED mới được phép tạo review.  
\- Mỗi booking chỉ cho phép một bản ghi \`Review\` (không trùng theo \`bookingId\`).

4.3.2 Function \`createReview\` (logic kiểm tra trong \`ReviewService\`)

Đoạn dưới mô tả luồng điều kiện tương đương mã nguồn Java trong \`ReviewService\` (rút gọn phần lưu entity):

public Review createReview(Long customerId, Long bookingId, Integer rating, String comment) {  
    Booking booking \= bookingRepository.findById(bookingId)  
            .orElseThrow(() \-\> new RuntimeException("Không tìm thấy đơn đặt lịch"));  
    // \--- Bắt đầu khối kiểm tra nghiệp vụ (sau khi đã có booking) \---

    // C1: Quyền — chỉ chủ đơn được đánh giá  
    if (\!booking.getCustomer().getId().equals(customerId)) {  
        throw new RuntimeException("Bạn chỉ có thể đánh giá đơn của chính mình");  
    }  
    // C2: Trạng thái đơn  
    if (booking.getStatus() \!= Booking.Status.COMPLETED) {  
        throw new RuntimeException("Chỉ đánh giá được đơn đã hoàn tất");  
    }  
    // C3: Phạm vi điểm  
    if (rating \== null || rating \< 1 || rating \> 5\) {  
        throw new RuntimeException("Điểm đánh giá phải từ 1 đến 5");  
    }  
    // C4: Trùng đánh giá theo booking  
    if (reviewRepository.findByBookingId(bookingId).isPresent()) {  
        throw new RuntimeException("Đơn này đã được đánh giá");  
    }  
    // \--- Kết thúc khối kiểm tra — tạo và lưu Review \---  
    Review review \= new Review();  
    review.setBooking(booking);  
    review.setRating(rating);  
    review.setComment(comment);  
    return reviewRepository.save(review);  
}

4.3.3 Đồ thị điều khiển (CFG) và phân tích

| Node | Mô Tả |
| :---- | :---- |
| A | Kiểm tra \`if (\!booking.getCustomer().getId().equals(customerId))\` — không đúng chủ đơn thì ném lỗi. |
| B | Kiểm tra \`if (booking.getStatus() \!= COMPLETED)\` — đơn chưa hoàn tất thì ném lỗi. |
| C | Kiểm tra \`if (rating \== null \\|\\| rating \< 1 \\|\\| rating \> 5)\` — điểm không hợp lệ thì ném lỗi. |
| D | Kiểm tra \`if (reviewRepository.findByBookingId(bookingId).isPresent())\` — đã có review thì ném lỗi. |
| E | Khối xử lý thành công: khởi tạo \`Review\`, gán \`booking\`, \`rating\`, \`comment\`, \`save\`. |
| F | Các nhánh \*\*ném lỗi\*\* (exit bất thường) tương ứng từng \`if\` trên. |

Luồng điều khiển: lần lượt qua A → B → C → D; nhánh điều kiện đúng (vi phạm) tại bất kỳ node nào dẫn tới F(throw); chỉ khi cả bốn điều kiện đều không vi phạm thì tới E.

4.3.4 Độ phức tạp Cyclomatic  
Dựa vào đồ thị điều khiển của \*\*khối bốn lệnh \`if\` tuần tự\*\* (Node A, B, C, D) sau khi đã có \`Booking\`:

\- Số node điều kiện rẽ nhánh P \= 4 (A, B, C, D).  
\- Độ phức tạp: V(G) \= P \+ 1 \= 4 \+ 1 \= 5\.

Tập đường dẫn cơ sở — cần 5 đường:

| Đường | Luồng | Gợi ý testcase |
| :---- | :---- | :---- |
| 1 | A (vi phạm) \-\> F | Không phải chủ đơn \- tương ứng TC02 |
| 2 | A (ok) \-\> b (vi phạm) \-\> F | Đơn chưa COMPLETED TC03 |
| 3 | A (ok) \-\> B (ok) \-\> C (vi phạm) \-\> F | ‘rating’ null hoặc ngoài 1-5 TC04, TC05 |
| 4 | A (ok) \-\> B (ok) \-\> C(ok) \-\> D(vi phạm) \-\> F | Đơn đã có review TC06 |
| 5 | A (ok) \-\> B(ok) \-\> C(ok) \-\> D(ok) \-\> E | Gửi đánh giá thành công TC01 |

4.3.5 Bảng Testcase phủ điều kiện (Condition Coverage)

Bảng minh họa các kịch bản đầu vào (black box / thiết kế từ payload \+ trạng thái hệ thống) đi qua các điều kiện trong mã nguồn Java. T (True) \= nhánh \`if\` tương ứng được thực thi (điều kiện trong \`if\` đúng, dẫn tới throw); F (False) \= không vào nhánh throw đó (điều kiện sai, bỏ qua \`if\` đó).

Ký hiệu:

\- C0: \`bookingId\` trỏ tới đơn tồn tại (sau \`findById\`).  
\- C1: Người gọi là chủ đơn (\`customerId\` khớp \`booking.customer\`).  
\- C2: \`booking.status \== COMPLETED\`.  
\- C3: \`rating\` hợp lệ (không null và 1 ≤ rating ≤ 5).  
\- C4: Chưa tồn tại \`Review\` cho \`bookingId\`.

| ID | Dữ liệu đầu vào | C0 | C1 | C2 | C3 | C4 | Kết quả mong đợi |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| TC\_01 | bookingId hợp lệ, đúng chủ, COMPLETED, rating=4, chưa có review | T | T | T | T | T | Thành công — lưu Review |
| TC\_02 | bookingId hợp lệ nhưng customerId khác chủ đơn | T | F | \_ | \_ | \_ | Lỗi: chỉ đánh giá đơn của chính mình |
| TC\_03 | Đúng chủ, đơn \*\*PENDING\*\* / \*\*CONFIRMED\*\*, rating=5, chưa review | T | T | F | \_ | \_ | Lỗi: chỉ đơn đã hoàn tất |
| TC\_04 | Đúng chủ, COMPLETED, \*\*rating \= null\*\*, chưa review | T | T | T | F | \_ | Lỗi: điểm 1–5 |
| TC\_05 | Đúng chủ, COMPLETED, \*\*rating \= 6\*\* (vượt biên), chưa review | T | T | T | F | \_ | Lỗi: điểm 1–5 |
| TC\_06 | Đúng chủ, COMPLETED, rating=5, \*\*đã có Review\*\* cho booking | T | T | T | T | F | Lỗi: đơn đã được đánh giá |
| TC\_07 | \*\*bookingId không tồn tại\*\* | F | \_ | \_ | \_ | \_ | Lỗi: không tìm thấy đơn |
| TC\_08 | Đúng chủ, COMPLETED, \*\*rating \= 1\*\* (biên dưới), chưa review | T | T | T | T | T | Thành công |
| TC\_09 | Đúng chủ, COMPLETED, \*\*rating \= 5\*\* (biên trên), chưa review | T | T | T | T | T | Thành công |
| TC\_10 | Giống TC\_01 nhưng \*\*comment \= null\*\* hoặc rỗng | T | T | T | T | T | Thành công |

Đánh giá kết quả kiểm thử (Evaluation)  
Quan sát ma trận T/F:

\- \*\*C0:\*\* Đạt \*\*T\*\* (TC\_01 … TC\_06, TC\_08 … TC\_10) và \*\*F\*\* (TC\_07).  
\- \*\*C1:\*\* Đạt \*\*T\*\* (TC\_01, TC\_03 … TC\_06, TC\_08 … TC\_10) và \*\*F\*\* (TC\_02).  
\- \*\*C2:\*\* Đạt \*\*T\*\* (TC\_01, TC\_04 … TC\_06, TC\_08 … TC\_10) và \*\*F\*\* (TC\_03).  
\- \*\*C3:\*\* Đạt \*\*T\*\* (TC\_01, TC\_06, TC\_08 … TC\_10) và \*\*F\*\* (TC\_04, TC\_05).  
\- \*\*C4:\*\* Đạt \*\*T\*\* (TC\_01, TC\_08 … TC\_10) và \*\*F\*\* (TC\_06).

\*\*Kết luận:\*\* Bộ testcase \*\*TC\_01 … TC\_10\*\* kích hoạt đủ các nhánh điều kiện chính trong \`createReview\` (bao gồm cả trường hợp không có booking — \*\*C0\*\*), đạt \*\*Condition Coverage\*\* đầy đủ cho các điều kiện \*\*C0–C4\*\* ở mức thiết kế kiểm thử hộp đen gắn với mã nguồn backend Java.  
4.4 Chức năng nạp ví

4.4.1. Tổng quan  
Nạp ví dành cho user (khách) đã đăng nhập: cộng tiền vào User.balance và ghi lịch sử giao dịch kiểu DEPOSIT. Không có tích hợp cổng thanh toán thật (MoMo/VNPay/chuyển khoản chỉ là nhãn “kênh” trên form và lưu trong DB).

## **4.4 Chức năng Nạp ví (Deposit)**

### **4.4.1 Mô tả mã nguồn Nạp ví**

Mã nguồn chức năng nạp ví được tổng hợp từ các bước kiểm tra của tầng Controller (`WalletController`) và logic xử lý cốt lõi của tầng Service (`WalletService`). Luồng điều kiện (Control Flow) của toàn bộ quá trình được mô phỏng với các Node rẽ nhánh được đánh số để dễ dàng tham chiếu trong phân tích Testcase: 

public Map\<String, Object\> deposit(HttpSession session, Map\<String, Object\> request) {  
   Long userId \= (Long) session.getAttribute("userId");  
    
   // \[Node 1\]: Kiểm tra đăng nhập  
   if (userId \== null) {  
       // \[Node 2\]: Chưa đăng nhập  
       throw new RuntimeException("Please login first");  
   }

   Number reqAmount \= (Number) request.get("amount");  
   String provider \= (String) request.getOrDefault("provider", "MANUAL");  
    
   // \[Node 3\]: Kiểm tra tồn tại thông tin amount từ request người dùng  
   if (reqAmount \== null) {  
       // \[Node 4\]: Báo lỗi thiếu amount  
       throw new RuntimeException("amount is required");  
   }

   BigDecimal amount \= BigDecimal.valueOf(reqAmount.doubleValue());  
    
   // \[Node 5\]: Kiểm tra tính hợp lệ số tiền nạp ở tầng Service (gồm 2 vế điều kiện)  
   if (amount \== null || amount.compareTo(BigDecimal.ZERO) \<= 0\) {  
       // \[Node 6\]: Ném lỗi số tiền không hợp lệ (âm hoặc bằng 0\)  
       throw new RuntimeException("Số tiền nạp phải lớn hơn 0");  
   }

   // \[Node 7\]: Truy vấn tìm kiếm người dùng trong hệ thống  
   User user \= userRepository.findById(userId).orElseThrow(() \-\>  
       // \[Node 8\]: Ném ngoại lệ khi không tìm thấy người dùng  
       new RuntimeException("Không tìm thấy người dùng")  
   );

   // Cập nhật số dư người dùng  
   user.setBalance(user.getBalance().add(amount));  
   userRepository.save(user);

   // Lưu lịch sử giao dịch mới (WalletTransaction)  
   WalletTransaction tx \= new WalletTransaction();  
   tx.setUser(user);  
   tx.setAmount(amount);  
   tx.setType(WalletTransaction.Type.DEPOSIT);

   // \[Node 9\]: Xác định Cổng thanh toán (Provider) qua toán tử 3 ngôi (gồm 2 vế điều kiện)  
   tx.setProvider((provider \== null || provider.isBlank())  
       ? "MANUAL"   // \[Node 10\]: Sử dụng MANUAL làm mặc định  
       : provider); // \[Node 11\]: Theo cổng Provider được truyền vào (VD: VNPAY)

   tx.setDescription("Nạp tiền vào ví");  
   walletTransactionRepository.save(tx);

   // \[Node 12\]: Trả về kết quả giao dịch thành công  
   Map\<String, Object\> payload \= new HashMap\<\>();  
   payload.put("balance", user.getBalance());  
   payload.put("message", "Nạp tiền thành công");  
    
   return payload; // Kết thúc chu trình  
}

## **Gemini đã nói**

Dưới đây là nội dung đã được tôi định dạng và cấu trúc lại để bạn dễ dàng theo dõi, đọc hiểu và tra cứu hơn:

## **4.4. Chức năng Nạp ví (Deposit)**

### **4.4.1. Mô tả mã nguồn Nạp ví**

Mã nguồn chức năng nạp ví được tổng hợp từ các bước kiểm tra của tầng Controller (WalletController) và logic xử lý cốt lõi của tầng Service (WalletService). Luồng điều kiện (Control Flow) của toàn bộ quá trình được mô phỏng với các Node rẽ nhánh được đánh số để dễ dàng tham chiếu trong phân tích Testcase:

public Map\<String, Object\> deposit(HttpSession session, Map\<String, Object\> request) {

   Long userId \= (Long) session.getAttribute("userId");


   // \[Node 1\]: Kiểm tra đăng nhập

   if (userId \== null) {

       // \[Node 2\]: Chưa đăng nhập

       throw new RuntimeException("Please login first");

   }

   Number reqAmount \= (Number) request.get("amount");

   String provider \= (String) request.getOrDefault("provider", "MANUAL");


   // \[Node 3\]: Kiểm tra tồn tại thông tin amount từ request người dùng

   if (reqAmount \== null) {

       // \[Node 4\]: Báo lỗi thiếu amount

       throw new RuntimeException("amount is required");

   }

   BigDecimal amount \= BigDecimal.valueOf(reqAmount.doubleValue());


   // \[Node 5\]: Kiểm tra tính hợp lệ số tiền nạp ở tầng Service (gồm 2 vế điều kiện)

   if (amount \== null || amount.compareTo(BigDecimal.ZERO) \<= 0) {

       // \[Node 6\]: Ném lỗi số tiền không hợp lệ (âm hoặc bằng 0\)

       throw new RuntimeException("Số tiền nạp phải lớn hơn 0");

   }

   // \[Node 7\]: Truy vấn tìm kiếm người dùng trong hệ thống

   User user \= userRepository.findById(userId).orElseThrow(() \-\>

       // \[Node 8\]: Ném ngoại lệ khi không tìm thấy người dùng

       new RuntimeException("Không tìm thấy người dùng")

   );

   // Cập nhật số dư người dùng

   user.setBalance(user.getBalance().add(amount));

   userRepository.save(user);

   // Lưu lịch sử giao dịch mới (WalletTransaction)

   WalletTransaction tx \= new WalletTransaction();

   tx.setUser(user);

   tx.setAmount(amount);

   tx.setType(WalletTransaction.Type.DEPOSIT);

   // \[Node 9\]: Xác định Cổng thanh toán (Provider) qua toán tử 3 ngôi (gồm 2 vế điều kiện)

   tx.setProvider((provider \== null || provider.isBlank())

       ? "MANUAL"   // \[Node 10\]: Sử dụng MANUAL làm mặc định

       : provider); // \[Node 11\]: Theo cổng Provider được truyền vào (VD: VNPAY)

   tx.setDescription("Nạp tiền vào ví");

   walletTransactionRepository.save(tx);

   // \[Node 12\]: Trả về kết quả giao dịch thành công

   Map\<String, Object\> payload \= new HashMap\<\>();

   payload.put("balance", user.getBalance());

   payload.put("message", "Nạp tiền thành công");


   return payload; // Kết thúc chu trình

}

**4.4.2. Đồ thị điều khiển (CFG) và phân tích Cyclomatic**

**1\. Phân tích các Node rẽ nhánh điều kiện (Predicates)**

Toàn bộ quy trình deposit nêu trên có các điểm rẽ nhánh độc lập bao gồm:

* **Node 1:** Điều kiện `userId == null` (Chưa đăng nhập)  
* **Node 3:** Điều kiện `reqAmount == null` (Không gửi kèm trường amount)  
* **Node 5a:** Điều kiện `amount == null` (Kiểm tra Null từ đối tượng BigDecimal)  
* **Node 5b:** Điều kiện `amount <= 0` (Bắt lỗi nạp tiền âm hoặc bằng 0\)  
* **Node 7:** Điều kiện khi đối tượng User rỗng (`!User.isPresent()`)  
* **Node 9a:** Điều kiện `provider == null` (Bỏ trống provider)  
* **Node 9b:** Điều kiện `provider.isBlank()` (Chuỗi khoảng trắng)

Tổng số điểm rẽ điều kiện độc lập (P) \= 7\.

**2\. Tính độ phức tạp thuật toán (Cyclomatic Complexity)**

* Công thức tính: **V(G) \= P \+ 1 \= 7 \+ 1 \= 8**  
* **Kết luận:** Chúng ta cần thiết kế đúng mô hình **8 đường dẫn cơ sở (Base Path)** để đảm bảo độ bao phủ theo nhánh đạt mức cực đại toàn cục đối với mã nguồn nạp tiền này.

  ### **4.4.3. Tập đường dẫn cơ sở (Base Paths)**

Dựa vào mức phức tạp Cyclomatic **V(G) \= 8**, các đường dẫn thực thi cơ sở được xây dựng như sau:

* **Đường 1 (Luồng lỗi chưa login):** Node 1(True) → Node 2  
* **Đường 2 (Luồng lỗi thiếu param amount):** Node 1(False) → Node 3(True) → Node 4  
* **Đường 3 (Luồng lỗi amount null khi Service gọi internal):** Node 1(False) → Node 3(False) → Node 5a(True) → Node 6  
* **Đường 4 (Luồng lỗi amount bằng 0 hoặc âm):** Node 1(False) → Node 3(False) → Node 5a(False) → Node 5b(True) → Node 6  
* **Đường 5 (Luồng lỗi User ID đã bị xóa):** Node 1(False) → Node 3(False) → Node 5b(False) → Node 7(True) → Node 8  
* **Đường 6 (Thành công \- provider vô định/null):** Node 1(False) → ... → Node 7(False) → Node 9a(True) → Node 10 → Node 12  
* **Đường 7 (Thành công \- provider chuỗi rỗng):** Node 1(False) → ... → Node 7(False) → Node 9a(False) → Node 9b(True) → Node 10 → Node 12  
* **Đường 8 (Happy Path \- Qua cổng thanh toán thật, VD: VNPAY):** Node 1(False) → ... → Node 7(False) → Node 9a(False) → Node 9b(False) → Node 11 → Node 12

### **4.4.4 Bảng thiết kế Testcase cho chức năng Nạp ví**

Bảng Testcase sử dụng phương pháp kiểm thử Whitebox phủ khép kín 8 đường dẫn như phân tích ở trên:

| ID | Kịch bản kiểm thử | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Output) | Loại bao phủ | Đường dẫn (Path) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC01 | Lỗi chưa đăng nhập | session \= rỗng (userId=null) | Ném ngoại lệ: "Please login first" | Phủ đường | Đường 1 (Node 1 → Node 2\) |
| TC02 | Lỗi thiếu số tiền | userId\=1, amount\=null | Ném ngoại lệ: "amount is required" | Phủ đường | Đường 2 (Node 1 → Node 3 → 4\) |
| TC03 | Lỗi amount bị null | userId\=1, amount\=null (Gửi thẳng qua Service) | Ném ngoại lệ: "Số tiền nạp phải lớn hơn 0" | Phủ Điều kiện nhánh | Đường 3 (Node 5a → Node 6\) |
| TC04 | Số tiền âm/không hợp lệ | userId\=1, amount\=-50000 đ | Ném ngoại lệ: "Số tiền nạp phải lớn hơn 0" | Phủ Điều kiện nhánh | Đường 4 (Node 5b → Node 6\) |
| TC05 | Người dùng không tồn tại | userId\=999 (ảo), amount\=100000 | Ném ngoại lệ: "Không tìm thấy người dùng" | Phủ nhánh | Đường 5 (Node 7 → Node 8\) |
| TC06 | Provider nhận giá trị Null | userId\=1, amount\=100000, provider\=null | Success: Cập nhật ví, log TX provider\="MANUAL" | Phủ Điều kiện nhánh | Đường 6 (Node 9a → Node 10\) |
| TC07 | Provider chuỗi rỗng | userId\=1, amount\=100000, provider\=" " | Success: Cập nhật ví, log TX provider\="MANUAL" | Phủ Điều kiện nhánh | Đường 7 (Node 9b → Node 10\) |
| TC08 | Qua Cổng thanh toán (Happy Path) | userId\=1, amount\=100000, provider\="VNPAY" | Success: Cập nhật ví, log TX provider\="VNPAY" | Phủ Đường | Đường 8 (Node 9b → Node 11 → 12\) |

### **4.4.5 Đánh giá độ bao phủ (Coverage Evaluation)**

**Kết luận:** \> Với 8 kịch bản kiểm thử (Testcase) chuyên biệt đã được thiết kế bên trên, toàn bộ 8 đường dẫn cơ sở (Base Path) của vòng kiểm duyệt đều được kích hoạt. Tất cả các mốc điều kiện rẽ nhánh (Predicate Condition) kết hợp giữa API Đầu vào và Logic CSDL đều được thực thi ít nhất một lần. Hệ thống cam kết kiểm soát hoàn toàn bộ **Path Coverage 100%** và **Branch-Condition Coverage 100%** đối với chức năng Nạp ví tiền.

