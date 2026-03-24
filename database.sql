-- Bảng users: Lưu trữ thông tin chung của tất cả người dùng
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role ENUM('customer', 'companion', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng companions: Lưu trữ thông tin chi tiết về Bạn đồng hành
CREATE TABLE companions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    bio TEXT,
    hobbies TEXT,
    appearance TEXT,
    availability TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Bảng bookings: Quản lý thông tin các buổi hẹn đã đặt
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    companion_id INT NOT NULL,
    booking_time DATETIME NOT NULL,
    duration INT NOT NULL, -- in minutes
    status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (companion_id) REFERENCES companions(id)
);

-- Bảng reviews: Lưu trữ các đánh giá của Khách hàng
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    rating INT NOT NULL, -- 1 to 5
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Bảng favorites: Lưu danh sách Bạn đồng hành yêu thích của Khách hàng
CREATE TABLE favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    companion_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (companion_id) REFERENCES companions(id)
);

-- Bảng reports: Ghi nhận các báo cáo, tố cáo từ người dùng
CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reporter_id INT NOT NULL,
    reported_user_id INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (reported_user_id) REFERENCES users(id)
);

-- Bảng transactions: Quản lý các giao dịch thanh toán
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Bảng service_prices: Bảng giá các dịch vụ
CREATE TABLE service_prices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_name VARCHAR(255) NOT NULL,
    price_per_hour DECIMAL(10, 2) NOT NULL,
    description TEXT
);

-- Bảng categories: Quản lý các danh mục
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL -- e.g., 'hobby', 'appearance'
);

-- Bảng companion_availabilities: Quản lý lịch rảnh của bạn đồng hành
CREATE TABLE companion_availabilities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    companion_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    note VARCHAR(500),
    FOREIGN KEY (companion_id) REFERENCES companions(id)
);

-- Bảng consultations: Quản lý câu hỏi tư vấn giữa khách hàng và bạn đồng hành
CREATE TABLE consultations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    companion_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    status ENUM('pending', 'answered') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answered_at TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (companion_id) REFERENCES companions(id)
);
