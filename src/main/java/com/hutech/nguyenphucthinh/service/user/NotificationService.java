package com.hutech.nguyenphucthinh.service.user;

import com.hutech.nguyenphucthinh.model.Notification;
import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.realtime.RealtimeBroadcastService;
import com.hutech.nguyenphucthinh.repository.NotificationRepository;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RealtimeBroadcastService realtimeBroadcastService;

    public Notification create(Long userId, String title, String content) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setIsRead(false);
        Notification saved = notificationRepository.save(notification);
        realtimeBroadcastService.publishNotification(saved);
        return saved;
    }

    public List<Notification> getMyNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông báo"));
        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền truy cập thông báo này");
        }
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }
}
