package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.service.user.UserLoginService;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserLoginControllerTest {

    @Mock
    private UserLoginService userLoginService;

    @Mock
    private HttpSession session;

    private UserLoginController controller;

    @BeforeEach
    void setUp() throws Exception {
        controller = new UserLoginController();
        inject(controller, "userLoginService", userLoginService);
    }

    @Test
    void loginDelegatesToService() {
        Map<String, String> body = Map.of("username", "a", "password", "b");
        Map<String, Object> expected = Map.of("success", true);
        when(userLoginService.login(eq(body), eq(session))).thenReturn(expected);

        assertEquals(expected, controller.login(body, session));
        verify(userLoginService).login(eq(body), eq(session));
    }

    private static void inject(Object target, String fieldName, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(target, value);
    }
}
