package com.hutech.nguyenphucthinh.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

@Component
public class AdminInterceptor implements HandlerInterceptor {
    public static final String ADMIN_AUTH_ATTR = "ADMIN_AUTHORIZED";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        HttpSession session = request.getSession(false);
        String role = session == null ? null : (String) session.getAttribute("role");
        Object userId = session == null ? null : session.getAttribute("userId");
        boolean isAdmin = userId != null && "ADMIN".equals(role);

        if (isAdmin) {
            request.setAttribute(ADMIN_AUTH_ATTR, true);
            return true;
        }

        request.setAttribute(ADMIN_AUTH_ATTR, false);
        if (isApiRequest(request)) {
            writeUnauthorized(response);
        } else {
            response.sendRedirect("/user/login.html");
        }
        return false;
    }

    private boolean isApiRequest(HttpServletRequest request) {
        return request.getRequestURI().startsWith("/api/");
    }

    private void writeUnauthorized(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"message\":\"Unauthorized admin access\"}");
    }
}
