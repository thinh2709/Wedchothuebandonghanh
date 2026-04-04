package com.hutech.nguyenphucthinh.service.user;

import com.hutech.nguyenphucthinh.model.Companion;
import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.repository.CompanionRepository;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * White-box {@link UserLoginService#login} — mục 4.1 báo cáo.
 */
@ExtendWith(MockitoExtension.class)
class UserLoginServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private CompanionRepository companionRepository;

    @Mock
    private HttpSession session;

    private UserLoginService loginService;

    @BeforeEach
    void setUp() {
        loginService = new UserLoginService();
        inject(loginService, "userService", userService);
        inject(loginService, "companionRepository", companionRepository);
    }

    @Test
    void loginFailsWhenUserMissing() {
        when(userService.login(anyString(), anyString())).thenReturn(Optional.empty());

        Map<String, Object> res = loginService.login(req("u", "p"), session);

        assertEquals(false, res.get("success"));
        assertEquals("Sai tên đăng nhập hoặc mật khẩu", res.get("message"));
    }

    @Test
    void loginFailsWhenLocked() {
        User u = user(1L, User.Role.CUSTOMER, User.ModerationFlag.NONE);
        u.setLocked(true);
        when(userService.login(anyString(), anyString())).thenReturn(Optional.of(u));

        Map<String, Object> res = loginService.login(req("u", "p"), session);

        assertEquals(false, res.get("success"));
        assertEquals("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.", res.get("message"));
    }

    @Test
    void loginFailsWhenBanned() {
        User u = user(1L, User.Role.CUSTOMER, User.ModerationFlag.BANNED);
        when(userService.login(anyString(), anyString())).thenReturn(Optional.of(u));

        Map<String, Object> res = loginService.login(req("u", "p"), session);

        assertEquals(false, res.get("success"));
    }

    @Test
    void loginSuccessCustomerWithWarning() {
        User u = user(2L, User.Role.CUSTOMER, User.ModerationFlag.WARNED);
        when(userService.login(anyString(), anyString())).thenReturn(Optional.of(u));
        when(companionRepository.findByUserId(2L)).thenReturn(Optional.empty());

        Map<String, Object> res = loginService.login(req("c", "p"), session);

        assertEquals(true, res.get("success"));
        assertEquals(true, res.get("warning"));
        assertEquals("CUSTOMER", res.get("role"));
        verify(session).setAttribute("userId", 2L);
    }

    @Test
    void loginSuccessCompanionRole() {
        User u = user(3L, User.Role.CUSTOMER, User.ModerationFlag.NONE);
        when(userService.login(anyString(), anyString())).thenReturn(Optional.of(u));
        when(companionRepository.findByUserId(3L)).thenReturn(Optional.of(new Companion()));

        Map<String, Object> res = loginService.login(req("comp", "p"), session);

        assertEquals(true, res.get("success"));
        assertEquals("COMPANION", res.get("role"));
    }

    @Test
    void loginSuccessPlainCustomer() {
        User u = user(4L, User.Role.CUSTOMER, User.ModerationFlag.NONE);
        when(userService.login(anyString(), anyString())).thenReturn(Optional.of(u));
        when(companionRepository.findByUserId(4L)).thenReturn(Optional.empty());

        Map<String, Object> res = loginService.login(req("cust", "p"), session);

        assertEquals(true, res.get("success"));
        assertEquals("CUSTOMER", res.get("role"));
        assertNull(res.get("warning"));
    }

    private static User user(Long id, User.Role role, User.ModerationFlag flag) {
        User u = new User();
        u.setId(id);
        u.setUsername("x");
        u.setPassword("y");
        u.setEmail(id + "@t.com");
        u.setRole(role);
        u.setModerationFlag(flag);
        u.setLocked(false);
        return u;
    }

    private static Map<String, String> req(String username, String password) {
        Map<String, String> m = new HashMap<>();
        m.put("username", username);
        m.put("password", password);
        return m;
    }

    private static void inject(Object target, String fieldName, Object value) {
        try {
            var f = target.getClass().getDeclaredField(fieldName);
            f.setAccessible(true);
            f.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }
}
