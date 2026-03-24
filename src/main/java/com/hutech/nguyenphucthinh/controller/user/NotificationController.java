package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.model.Notification;
import com.hutech.nguyenphucthinh.service.user.NotificationService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class NotificationController {
    @Autowired
    private NotificationService notificationService;

    @GetMapping("/api/user/notifications/me")
    public List<Notification> getUserNotifications(HttpSession session) {
        return getMyNotificationsByRole(session, "CUSTOMER");
    }

    @PatchMapping("/api/user/notifications/{id}/read")
    public ResponseEntity<?> markUserAsRead(@PathVariable Long id, HttpSession session) {
        return markAsReadByRole(id, session, "CUSTOMER");
    }

    @PatchMapping("/api/user/notifications/read-all")
    public ResponseEntity<?> markAllUserAsRead(HttpSession session) {
        return markAllAsReadByRole(session, "CUSTOMER");
    }

    @GetMapping("/api/companion/notifications/me")
    public List<Notification> getCompanionNotifications(HttpSession session) {
        return getMyNotificationsByRole(session, "COMPANION");
    }

    @PatchMapping("/api/companion/notifications/{id}/read")
    public ResponseEntity<?> markCompanionAsRead(@PathVariable Long id, HttpSession session) {
        return markAsReadByRole(id, session, "COMPANION");
    }

    @PatchMapping("/api/companion/notifications/read-all")
    public ResponseEntity<?> markAllCompanionAsRead(HttpSession session) {
        return markAllAsReadByRole(session, "COMPANION");
    }

    @GetMapping("/api/admin/notifications/me")
    public List<Notification> getAdminNotifications(HttpSession session) {
        return getMyNotificationsByRole(session, "ADMIN");
    }

    @PatchMapping("/api/admin/notifications/{id}/read")
    public ResponseEntity<?> markAdminAsRead(@PathVariable Long id, HttpSession session) {
        return markAsReadByRole(id, session, "ADMIN");
    }

    @PatchMapping("/api/admin/notifications/read-all")
    public ResponseEntity<?> markAllAdminAsRead(HttpSession session) {
        return markAllAsReadByRole(session, "ADMIN");
    }

    private List<Notification> getMyNotificationsByRole(HttpSession session, String requiredRole) {
        Long userId = getAuthorizedUserId(session, requiredRole);
        return notificationService.getMyNotifications(userId);
    }

    private ResponseEntity<?> markAsReadByRole(Long id, HttpSession session, String requiredRole) {
        Long userId = getAuthorizedUserId(session, requiredRole);
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private ResponseEntity<?> markAllAsReadByRole(HttpSession session, String requiredRole) {
        Long userId = getAuthorizedUserId(session, requiredRole);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Long getAuthorizedUserId(HttpSession session, String requiredRole) {
        Long userId = (Long) session.getAttribute("userId");
        String role = (String) session.getAttribute("role");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        if (!requiredRole.equals(role)) {
            throw new RuntimeException("Access denied");
        }
        return userId;
    }
}
