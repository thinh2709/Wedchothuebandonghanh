-- Tạo database test (chạy bằng: mysql -u root -p < scripts/seed_mysql_test.sql).
-- Schema & bảng do Spring Boot (Hibernate ddl-auto=update) tự tạo khi khởi động app với profile dbtest.
-- Dữ liệu mẫu: RealisticDataSeeder + DbTestModerationSeeder (Java) khi app start lần đầu.

CREATE DATABASE IF NOT EXISTS rental_companion_db_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
