package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.model.WalletTransaction;
import com.hutech.nguyenphucthinh.service.user.WalletService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/transactions")
    public List<WalletTransaction> getMyTransactions(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Please login first");
        return walletService.getHistory(userId);
    }
}
