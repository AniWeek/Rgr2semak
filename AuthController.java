package com.testingsystem.controller;

import com.testingsystem.model.User;
import com.testingsystem.service.UserService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {
    
    private final UserService userService;
    
    public AuthController(UserService userService) {
        this.userService = userService;
    }
    
    @PostMapping("/register")
    public User register(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String email = request.get("email");
        String password = request.get("password");
        
        return userService.register(name, email, password);
    }
    
    @GetMapping("/verify")
    public String verifyEmail(@RequestParam String code) {
        try {
            userService.verifyEmail(code);
            return "Email успешно подтвержден! Теперь вы можете войти в систему.";
        } catch (Exception e) {
            return "Ошибка подтверждения: " + e.getMessage();
        }
    }
    
    @PostMapping("/verify/resend")
    public String resendVerification(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        userService.resendVerificationCode(email);
        return "Новый код подтверждения отправлен на почту";
    }
    
    @PostMapping("/login")
    public User login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        
        return userService.login(email, password);
    }
    
    @PostMapping("/forgot-password")
    public String forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        userService.requestPasswordReset(email);
        return "Инструкции по восстановлению пароля отправлены на почту";
    }
    
    @PostMapping("/reset-password")
    public User resetPassword(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        String newPassword = request.get("newPassword");
        
        return userService.resetPassword(code, newPassword);
    }
}