package com.hutech.nguyenphucthinh.service.user;

import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.model.WalletTransaction;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import com.hutech.nguyenphucthinh.repository.WalletTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Nạp ví (mục 4.4) — tách khỏi {@link WalletService} để báo cáo JaCoCo chỉ tính trên phạ vi phân tích.
 */
@Service
public class WalletDepositService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    public User deposit(Long userId, BigDecimal amount, String provider) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền nạp phải lớn hơn 0");
        }
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        user.setBalance(user.getBalance().add(amount));
        userRepository.save(user);

        WalletTransaction tx = new WalletTransaction();
        tx.setUser(user);
        tx.setAmount(amount);
        tx.setType(WalletTransaction.Type.DEPOSIT);
        tx.setProvider(provider == null || provider.isBlank() ? "MANUAL" : provider);
        tx.setDescription("Nạp tiền vào ví");
        walletTransactionRepository.save(tx);
        return user;
    }
}
