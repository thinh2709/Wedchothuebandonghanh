package com.hutech.nguyenphucthinh.service.user;

import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.repository.CompanionRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Đăng nhập (mục 4.1) — logic white-box tách khỏi controller để đo phủ đúng phạ vi phân tích.
 */
@Service
public class UserLoginService {

    @Autowired
    private UserService userService;

    @Autowired
    private CompanionRepository companionRepository;

    public Map<String, Object> login(Map<String, String> request, HttpSession session) {
        String username = request.get("username");
        String password = request.get("password");
        Optional<User> user = userService.login(username, password);
        Map<String, Object> response = new HashMap<>();
        if (user.isPresent()) {
            if (Boolean.TRUE.equals(user.get().getLocked())
                    || User.ModerationFlag.BANNED.equals(user.get().getModerationFlag())) {
                response.put("success", false);
                response.put("message", "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
                return response;
            }
            if (User.ModerationFlag.WARNED.equals(user.get().getModerationFlag())) {
                response.put("warning", true);
                response.put("warningMessage", "Tài khoản của bạn đang ở trạng thái cảnh báo. Vui lòng tuân thủ chính sách để tránh bị khóa.");
            }
            String effectiveRole = companionRepository.findByUserId(user.get().getId()).isPresent()
                    ? "COMPANION"
                    : user.get().getRole().name();
            session.setAttribute("userId", user.get().getId());
            session.setAttribute("username", user.get().getUsername());
            session.setAttribute("role", effectiveRole);

            response.put("success", true);
            response.put("userId", user.get().getId());
            response.put("username", user.get().getUsername());
            response.put("role", effectiveRole);
            return response;
        } else {
            response.put("success", false);
            response.put("message", "Sai tên đăng nhập hoặc mật khẩu");
            return response;
        }
    }
}
