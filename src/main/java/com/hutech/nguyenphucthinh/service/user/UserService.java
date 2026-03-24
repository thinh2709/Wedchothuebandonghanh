package com.hutech.nguyenphucthinh.service.user;

import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public User register(User user) {
        String username = normalize(user.getUsername());
        String email = normalize(user.getEmail());
        String password = user.getPassword() == null ? "" : user.getPassword().trim();

        if (username.isBlank()) {
            throw new RuntimeException("Tên đăng nhập không được để trống");
        }
        if (username.length() < 4 || username.length() > 30) {
            throw new RuntimeException("Tên đăng nhập phải từ 4-30 ký tự");
        }
        if (!username.matches("^[a-zA-Z0-9._-]+$")) {
            throw new RuntimeException("Tên đăng nhập chỉ được chứa chữ, số, dấu chấm, gạch dưới, gạch ngang");
        }
        if (email.isBlank()) {
            throw new RuntimeException("Email không được để trống");
        }
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new RuntimeException("Email không hợp lệ");
        }
        if (password.length() < 6) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 6 ký tự");
        }

        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(password);

        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại");
        }
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã tồn tại");
        }
        return userRepository.save(user);
    }

    public Optional<User> login(String username, String password) {
        String normalizedUsername = normalize(username);
        String normalizedPassword = password == null ? "" : password.trim();
        if (normalizedUsername.isBlank() || normalizedPassword.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findByUsername(normalizedUsername)
                .filter(user -> user.getPassword().equals(normalizedPassword));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
