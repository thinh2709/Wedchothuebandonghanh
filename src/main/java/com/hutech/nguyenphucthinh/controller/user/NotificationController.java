package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.model.Notification;
import com.hutech.nguyenphucthinh.service.user.NotificationService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    @Autowired
    private NotificationService notificationService;

    @GetMapping("/me")
    public List<Notification> getMyNotifications(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Please login first");
        return notificationService.getMyNotifications(userId);
    }
}
