package com.testingsystem.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("timestamp", LocalDateTime.now());
        response.put("message", "Система тестирования работает");
        response.put("version", "1.0.0");

        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("register", "POST /api/auth/register");
        endpoints.put("login", "POST /api/auth/login");
        endpoints.put("verify_email", "GET /api/auth/verify?code={code}");
        endpoints.put("resend_verification", "POST /api/auth/verify/resend");
        endpoints.put("forgot_password", "POST /api/auth/forgot-password");
        endpoints.put("reset_password", "POST /api/auth/reset-password");
        endpoints.put("tests_list", "GET /api/tests");
        endpoints.put("test_details", "GET /api/tests/{id}");
        endpoints.put("create_test", "POST /api/tests/create");
        endpoints.put("test_questions", "GET /api/tests/{id}/questions");
        endpoints.put("submit_test", "POST /api/tests/{id}/submit");
        endpoints.put("admin_users", "GET /api/admin/users");
        endpoints.put("admin_user_details", "GET /api/admin/users/{id}");
        endpoints.put("admin_update_role", "PUT /api/admin/users/{id}/role");
        endpoints.put("admin_toggle_status", "PUT /api/admin/users/{id}/status");
        endpoints.put("admin_delete_user", "DELETE /api/admin/users/{id}");

        response.put("endpoints", endpoints);
        return ResponseEntity.ok(response);
    }
}