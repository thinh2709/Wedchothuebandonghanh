package com.hutech.nguyenphucthinh.service.user;

import com.hutech.nguyenphucthinh.model.Booking;
import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.model.WalletTransaction;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import com.hutech.nguyenphucthinh.repository.WalletTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class WalletService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    public User getUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User deposit(Long userId, BigDecimal amount, String provider) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Deposit amount must be greater than 0");
        }
        User user = getUser(userId);
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

    public void holdForBooking(User user, Booking booking, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        if (user.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Số dư ví không đủ để giữ tiền cọc");
        }
        user.setBalance(user.getBalance().subtract(amount));
        userRepository.save(user);

        WalletTransaction tx = new WalletTransaction();
        tx.setUser(user);
        tx.setBooking(booking);
        tx.setAmount(amount.negate());
        tx.setType(WalletTransaction.Type.HOLD);
        tx.setProvider("SYSTEM");
        tx.setDescription("Giữ tiền cọc khi đơn được chấp nhận");
        walletTransactionRepository.save(tx);
    }

    public void refundForBooking(User user, Booking booking, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        user.setBalance(user.getBalance().add(amount));
        userRepository.save(user);

        WalletTransaction tx = new WalletTransaction();
        tx.setUser(user);
        tx.setBooking(booking);
        tx.setAmount(amount);
        tx.setType(WalletTransaction.Type.REFUND);
        tx.setProvider("SYSTEM");
        tx.setDescription("Hoàn tiền cọc");
        walletTransactionRepository.save(tx);
    }

    public void chargeForBooking(User user, Booking booking, BigDecimal amount) {
        WalletTransaction tx = new WalletTransaction();
        tx.setUser(user);
        tx.setBooking(booking);
        tx.setAmount(amount.negate());
        tx.setType(WalletTransaction.Type.CHARGE);
        tx.setProvider("SYSTEM");
        tx.setDescription("Thanh toán booking");
        walletTransactionRepository.save(tx);
    }

    public List<WalletTransaction> getHistory(Long userId) {
        return walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
