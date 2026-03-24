package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.model.ChatMessage;
import com.hutech.nguyenphucthinh.service.user.ChatService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @Autowired
    private ChatService chatService;

    @GetMapping("/{bookingId}/messages")
    public List<ChatMessage> getMessages(@PathVariable Long bookingId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Please login first");
        return chatService.getMessages(userId, bookingId);
    }

    @PostMapping("/{bookingId}/messages")
    public ChatMessage sendMessage(@PathVariable Long bookingId, @RequestBody Map<String, String> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Please login first");
        return chatService.sendMessage(userId, bookingId, request.get("content"));
    }

    @GetMapping("/{bookingId}/call")
    public Map<String, Object> getCallInfo(@PathVariable Long bookingId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Please login first");
        return chatService.generateCallInfo(userId, bookingId);
    }
}
