package com.hutech.nguyenphucthinh.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Component
public class DatabaseMigration implements CommandLineRunner {

    @Autowired
    private DataSource dataSource;

    @Override
    public void run(String... args) {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(
                "ALTER TABLE bookings MODIFY COLUMN status VARCHAR(20) DEFAULT 'PENDING'"
            );
        } catch (Exception ignored) {
        }
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            // JPA ddl-auto=update đã có thể tự tạo, nhưng thêm try/catch cho chắc.
            stmt.executeUpdate(
                "ALTER TABLE companions ADD COLUMN cover_url VARCHAR(500)"
            );
        } catch (Exception ignored) {
        }
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("ALTER TABLE companions DROP COLUMN game_rank");
        } catch (Exception ignored) {
        }
    }
}
