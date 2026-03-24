package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.service.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Controller
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/register")
    public String showRegistrationForm() {
        return "redirect:/user/register.html";
    }

    @PostMapping("/register")
    public String register(@RequestParam String username, @RequestParam String password, @RequestParam String email) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(password);
        user.setEmail(email);
        user.setRole(User.Role.CUSTOMER);
        try {
            userService.register(user);
            return "redirect:/user/login?registered=1";
        } catch (Exception e) {
            String error = URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);
            return "redirect:/user/register?error=" + error;
        }
    }

    @GetMapping("/login")
    public String showLoginForm() {
        return "redirect:/user/login.html";
    }

    @PostMapping("/login")
    public String login(@RequestParam String username, @RequestParam String password, HttpSession session) {
        Optional<User> user = userService.login(username, password);
        if (user.isPresent()) {
            session.setAttribute("userId", user.get().getId());
            session.setAttribute("username", user.get().getUsername());
            session.setAttribute("role", user.get().getRole().name());
            if (user.get().getRole() == User.Role.COMPANION) {
                return "redirect:/companion/dashboard.html";
            }
            if (user.get().getRole() == User.Role.ADMIN) {
                return "redirect:/admin/dashboard.html";
            }
            String usernameEncoded = URLEncoder.encode(user.get().getUsername(), StandardCharsets.UTF_8);
            return "redirect:/user/index.html?loginSuccess=1&username=" + usernameEncoded;
        } else {
            String error = URLEncoder.encode("Sai tên đăng nhập hoặc mật khẩu", StandardCharsets.UTF_8);
            return "redirect:/user/login?error=" + error;
        }
    }

    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/user/index.html";
    }
}
