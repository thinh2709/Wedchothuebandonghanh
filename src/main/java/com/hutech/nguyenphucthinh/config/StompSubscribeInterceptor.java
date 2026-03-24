package com.hutech.nguyenphucthinh.config;

import com.hutech.nguyenphucthinh.service.user.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class StompSubscribeInterceptor implements ChannelInterceptor {
    @Autowired
    @Lazy
    private ChatService chatService;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }
        if (!StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            return message;
        }
        String dest = accessor.getDestination();
        Map<String, Object> attrs = accessor.getSessionAttributes();
        Long userId = attrs != null ? (Long) attrs.get("userId") : null;
        if (userId == null) {
            throw new IllegalStateException("Chưa đăng nhập");
        }
        if (dest != null && dest.startsWith("/topic/chat.booking.")) {
            long bookingId = Long.parseLong(dest.substring("/topic/chat.booking.".length()));
            if (!chatService.canAccessBookingChat(userId, bookingId)) {
                throw new IllegalStateException("Không có quyền xem cuộc trò chuyện này");
            }
        } else if (dest != null && dest.startsWith("/topic/location.booking.")) {
            long bookingId = Long.parseLong(dest.substring("/topic/location.booking.".length()));
            if (!chatService.canAccessBookingChat(userId, bookingId)) {
                throw new IllegalStateException("Không có quyền theo dõi vị trí đơn này");
            }
        } else if (dest != null && dest.startsWith("/topic/notifications.user.")) {
            long targetUserId = Long.parseLong(dest.substring("/topic/notifications.user.".length()));
            if (userId != targetUserId) {
                throw new IllegalStateException("Không có quyền đăng ký kênh thông báo này");
            }
        }
        return message;
    }
}
