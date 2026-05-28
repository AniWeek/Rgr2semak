package com.testingsystem.interceptor;

import com.testingsystem.model.User;
import com.testingsystem.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import java.util.UUID;

@Component
public class UserIdInterceptor implements HandlerInterceptor {

    private final UserService userService;

    public UserIdInterceptor(UserService userService) {
        this.userService = userService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String userIdHeader = request.getHeader("X-User-Id");

        if (userIdHeader != null && !userIdHeader.isEmpty()) {
            try {
                UUID userId = UUID.fromString(userIdHeader);
                request.setAttribute("userId", userId);

                User user = userService.getUserById(userId);
                boolean isAdmin = "ADMIN".equals(user.getRole());
                request.setAttribute("isAdmin", isAdmin);

            } catch (Exception e) {
                // Игнорируем ошибки парсинга
            }
        }

        return true;
    }
}