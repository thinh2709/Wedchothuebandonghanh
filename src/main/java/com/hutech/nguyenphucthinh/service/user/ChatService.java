package com.hutech.nguyenphucthinh.service.user;

import com.hutech.nguyenphucthinh.model.Booking;
import com.hutech.nguyenphucthinh.model.ChatMessage;
import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.repository.BookingRepository;
import com.hutech.nguyenphucthinh.repository.ChatMessageRepository;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatService {
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    @Autowired
    private UserRepository userRepository;

    private Booking getAuthorizedBooking(Long userId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt lịch"));
        boolean isCustomer = booking.getCustomer().getId().equals(userId);
        boolean isCompanion = booking.getCompanion().getUser().getId().equals(userId);
        if (!isCustomer && !isCompanion) {
            throw new RuntimeException("Bạn không có quyền truy cập đơn đặt lịch này");
        }
        return booking;
    }

    public List<ChatMessage> getMessages(Long userId, Long bookingId) {
        getAuthorizedBooking(userId, bookingId);
        return chatMessageRepository.findByBookingIdOrderByCreatedAtAsc(bookingId);
    }

    public ChatMessage sendMessage(Long userId, Long bookingId, String content) {
        if (content == null || content.isBlank()) {
            throw new RuntimeException("Nội dung tin nhắn là bắt buộc");
        }
        Booking booking = getAuthorizedBooking(userId, bookingId);
        User sender = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        ChatMessage msg = new ChatMessage();
        msg.setBooking(booking);
        msg.setSender(sender);
        msg.setContent(content.trim());
        msg.setCreatedAt(LocalDateTime.now());
        return chatMessageRepository.save(msg);
    }

    public Map<String, Object> generateCallInfo(Long userId, Long bookingId) {
        Booking booking = getAuthorizedBooking(userId, bookingId);
        Map<String, Object> payload = new HashMap<>();
        payload.put("roomId", "booking-room-" + bookingId);
        payload.put("token", "internal-demo-token-" + userId + "-" + bookingId);
        payload.put("provider", "INTERNAL_DEMO_VOIP");
        payload.put("bookingStatus", booking.getStatus().name());
        return payload;
    }
}
