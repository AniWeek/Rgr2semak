package com.testingsystem.controller;

import com.testingsystem.model.User;
import com.testingsystem.service.TestService;
import com.testingsystem.service.UserService;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    private final UserService userService;
    private final TestService testService;

    public AdminController(UserService userService, TestService testService) {
        this.userService = userService;
        this.testService = testService;
    }

    @GetMapping("/users")
    public Iterable<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/users/{id}")
    public User getUserById(@PathVariable UUID id) {
        return userService.getUserById(id);
    }

    @PutMapping("/users/{id}/role")
    public User updateRole(@PathVariable UUID id, @RequestBody Map<String, String> request, @RequestAttribute("userId") UUID currentAdminId) {
        return userService.updateRole(id, request.get("role"), currentAdminId);
    }

    @PutMapping("/users/{id}/status")
    public User toggleStatus(@PathVariable UUID id, @RequestAttribute("userId") UUID currentAdminId) {
        return userService.toggleStatus(id, currentAdminId);
    }

    @PostMapping("/users/{id}/ban")
    public User banUser(@PathVariable UUID id, @RequestAttribute("userId") UUID currentAdminId) {
        return userService.banUser(id, currentAdminId);
    }

    @PostMapping("/users/{id}/unban")
    public User unbanUser(@PathVariable UUID id, @RequestAttribute("userId") UUID currentAdminId) {
        return userService.unbanUser(id, currentAdminId);
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable UUID id, @RequestAttribute("userId") UUID currentAdminId) {
        userService.deleteUser(id, currentAdminId);
    }

    @GetMapping("/config/registration")
    public Map<String, Boolean> getRegistrationConfig() {
        return Map.of("enabled", userService.isRegistrationEnabled());
    }

    @PutMapping("/config/registration")
    public Map<String, Boolean> updateRegistrationConfig(@RequestBody Map<String, Boolean> request) {
        boolean enabled = request.getOrDefault("enabled", true);
        userService.setRegistrationEnabled(enabled);
        return Map.of("enabled", enabled);
    }

    @GetMapping("/statistics")
    public Map<String, Object> getAdminStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTests", testService.getTotalTestsCount());
        stats.put("completedTests", testService.getCompletedTestsCount());
        stats.put("totalUsers", userService.getTotalUsersCount());
        return stats;
    }
}