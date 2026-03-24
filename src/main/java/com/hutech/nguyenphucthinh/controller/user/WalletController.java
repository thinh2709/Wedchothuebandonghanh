package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.model.WalletTransaction;
import com.hutech.nguyenphucthinh.service.user.WalletService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {
    @Autowired
    private WalletService walletService;

    @GetMapping("/me")
    public Map<String, Object> getMyWallet(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Please login first");
        User user = walletService.getUser(userId);
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", user.getId());
        payload.put("balance", user.getBalance());
        return payload;
    }

    @PostMapping("/deposit")
    public Map<String, Object> deposit(@RequestBody Map<String, Object> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Please login first");
        Number amount = (Number) request.get("amount");
        String provider = (String) request.getOrDefault("provider", "MANUAL");
        if (amount == null) throw new RuntimeException("amount is required");
        User user = walletService.deposit(userId, BigDecimal.valueOf(amount.doubleValue()), provider);
        Map<String, Object> payload = new HashMap<>();
        payload.put("balance", user.getBalance());
        payload.put("message", "Nap tien thanh cong");
        return payload;
    }

    @GetMapping("/transactions")
    public List<WalletTransaction> getMyTransactions(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Please login first");
        return walletService.getHistory(userId);
    }
}
