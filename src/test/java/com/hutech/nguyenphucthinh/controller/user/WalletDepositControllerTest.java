package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.service.user.WalletDepositService;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * White-box nạp ví (controller) — mục 4.4; gọi {@link WalletDepositService}.
 */
@ExtendWith(MockitoExtension.class)
class WalletDepositControllerTest {

    @Mock
    private WalletDepositService walletDepositService;

    @Mock
    private HttpSession session;

    private WalletDepositController controller;

    @BeforeEach
    void setUp() throws Exception {
        controller = new WalletDepositController();
        inject(controller, "walletDepositService", walletDepositService);
    }

    @Test
    void depositWithoutLogin_throws() {
        when(session.getAttribute("userId")).thenReturn(null);
        Map<String, Object> body = Map.of("amount", 100000);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> controller.deposit(body, session));
        assertTrue(ex.getMessage().contains("login"));
    }

    @Test
    void depositMissingAmount_throws() {
        when(session.getAttribute("userId")).thenReturn(1L);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> controller.deposit(new HashMap<>(), session));
        assertTrue(ex.getMessage().contains("amount"));
    }

    @Test
    void depositSuccess_returnsBalanceAndMessage() {
        when(session.getAttribute("userId")).thenReturn(1L);
        User user = new User();
        user.setBalance(new BigDecimal("250000"));
        when(walletDepositService.deposit(eq(1L), any(BigDecimal.class), eq("VNPAY"))).thenReturn(user);

        Map<String, Object> body = new HashMap<>();
        body.put("amount", 100000);
        body.put("provider", "VNPAY");

        Map<String, Object> res = controller.deposit(body, session);

        assertEquals("Nạp tiền thành công", res.get("message"));
        assertEquals(new BigDecimal("250000"), res.get("balance"));
        verify(walletDepositService).deposit(eq(1L), any(BigDecimal.class), eq("VNPAY"));
    }

    private static void inject(Object target, String fieldName, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(target, value);
    }
}
