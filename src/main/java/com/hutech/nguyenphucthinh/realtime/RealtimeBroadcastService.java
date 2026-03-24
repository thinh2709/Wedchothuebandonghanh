package com.hutech.nguyenphucthinh.realtime;

import com.hutech.nguyenphucthinh.model.ChatMessage;
import com.hutech.nguyenphucthinh.model.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class RealtimeBroadcastService {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void publishChatMessage(ChatMessage msg) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", msg.getId());
        payload.put("bookingId", msg.getBooking().getId());
        payload.put("senderId", msg.getSender().getId());
        payload.put("senderUsername", msg.getSender().getUsername());
        payload.put("content", msg.getContent());
        payload.put("createdAt", msg.getCreatedAt() != null ? msg.getCreatedAt().toString() : null);
        messagingTemplate.convertAndSend("/topic/chat.booking." + msg.getBooking().getId(), (Object) payload);
    }

    public void publishNotification(Notification n) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", n.getId());
        payload.put("title", n.getTitle());
        payload.put("content", n.getContent());
        payload.put("isRead", Boolean.TRUE.equals(n.getIsRead()));
        payload.put("createdAt", n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
        Long userId = n.getUser().getId();
        messagingTemplate.convertAndSend("/topic/notifications.user." + userId, (Object) payload);
    }
}
