package com.hutech.nguyenphucthinh.config;

import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Tài khoản cố định phục vụ Cypress (LG-04, LG-05, LG-06).
 * Mật khẩu: 123456 (khớp cypress.config.js / cypress.env.example.json).
 * Tắt: app.e2e-seed-moderation-users=false (vd. production).
 */
@Component
@Order(200)
@ConditionalOnProperty(name = "app.e2e-seed-moderation-users", havingValue = "true", matchIfMissing = true)
public class DbTestModerationSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) {
        saveIfAbsent("e2e_locked", "e2e_locked@e2e.test", User.Role.CUSTOMER, true, User.ModerationFlag.NONE);
        saveIfAbsent("e2e_warned", "e2e_warned@e2e.test", User.Role.CUSTOMER, false, User.ModerationFlag.WARNED);
        saveIfAbsent("e2e_banned", "e2e_banned@e2e.test", User.Role.CUSTOMER, false, User.ModerationFlag.BANNED);
    }

    private void saveIfAbsent(String username, String email, User.Role role, boolean locked, User.ModerationFlag flag) {
        if (userRepository.findByUsername(username).isPresent()) {
            return;
        }
        User u = new User();
        u.setUsername(username);
        u.setEmail(email);
        u.setPassword(encoder.encode("123456"));
        u.setFullName("E2E " + username);
        u.setRole(role);
        u.setLocked(locked);
        u.setModerationFlag(flag);
        u.setBalance(BigDecimal.ZERO);
        userRepository.save(u);
    }
}
