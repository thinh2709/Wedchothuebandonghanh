package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.service.user.WalletDepositService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
public class WalletDepositController {

    @Autowired
    private WalletDepositService walletDepositService;

    @PostMapping("/deposit")
    public Map<String, Object> deposit(@RequestBody Map<String, Object> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        Number amount = (Number) request.get("amount");
        String provider = (String) request.getOrDefault("provider", "MANUAL");
        if (amount == null) {
            throw new RuntimeException("amount is required");
        }
        User user = walletDepositService.deposit(userId, BigDecimal.valueOf(amount.doubleValue()), provider);
        Map<String, Object> payload = new HashMap<>();
        payload.put("balance", user.getBalance());
        payload.put("message", "Nạp tiền thành công");
        return payload;
    }
}
