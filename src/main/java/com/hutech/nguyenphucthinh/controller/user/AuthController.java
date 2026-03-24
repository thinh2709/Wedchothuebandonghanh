package com.hutech.nguyenphucthinh.controller.user;

import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/me")
    public Map<String, Object> getCurrentUser(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        Object userId = session.getAttribute("userId");
        if (userId == null) {
            response.put("authenticated", false);
            return response;
        }

        response.put("authenticated", true);
        response.put("userId", userId);
        response.put("username", session.getAttribute("username"));
        response.put("role", session.getAttribute("role"));
        return response;
    }
}
