package com.hutech.nguyenphucthinh.service.user;

import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.model.WalletTransaction;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import com.hutech.nguyenphucthinh.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.*;

/**
 * Bám {@link WalletDepositService#deposit} — tương ứng mục 4.4 (Node 5–11 trong báo cáo; controller kiểm tra session/amount null riêng).
 */
@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private WalletTransactionRepository walletTransactionRepository;

    @InjectMocks
    private WalletDepositService walletDepositService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setBalance(new BigDecimal("50000"));
        lenient().when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        lenient().when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(walletTransactionRepository.save(any(WalletTransaction.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void depositThrowsWhenAmountNull() {
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> walletDepositService.deposit(1L, null, "VNPAY"));
        assertTrue(ex.getMessage().contains("lớn hơn 0"));
    }

    @Test
    void depositThrowsWhenAmountZeroOrNegative() {
        assertThrows(RuntimeException.class, () -> walletDepositService.deposit(1L, BigDecimal.ZERO, "MANUAL"));
        assertThrows(RuntimeException.class, () -> walletDepositService.deposit(1L, new BigDecimal("-1"), "MANUAL"));
    }

    @Test
    void depositThrowsWhenUserMissing() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> walletDepositService.deposit(999L, new BigDecimal("100000"), "MANUAL"));
        assertTrue(ex.getMessage().contains("Không tìm thấy người dùng"));
    }

    @Test
    void depositAddsBalanceAndSetsProviderManualWhenNullOrBlank() {
        walletDepositService.deposit(1L, new BigDecimal("100000"), null);
        assertEquals(new BigDecimal("150000"), user.getBalance());

        ArgumentCaptor<WalletTransaction> cap = ArgumentCaptor.forClass(WalletTransaction.class);
        verify(walletTransactionRepository).save(cap.capture());
        assertEquals("MANUAL", cap.getValue().getProvider());

        walletDepositService.deposit(1L, new BigDecimal("10000"), "   ");
        verify(walletTransactionRepository, times(2)).save(any());
    }

    @Test
    void depositKeepsExplicitProvider() {
        walletDepositService.deposit(1L, new BigDecimal("50000"), "VNPAY");

        ArgumentCaptor<WalletTransaction> cap = ArgumentCaptor.forClass(WalletTransaction.class);
        verify(walletTransactionRepository).save(cap.capture());
        assertEquals("VNPAY", cap.getValue().getProvider());
        assertEquals(WalletTransaction.Type.DEPOSIT, cap.getValue().getType());
    }
}
