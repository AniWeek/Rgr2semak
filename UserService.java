package com.testingsystem.service;

import com.testingsystem.model.SystemConfig;
import com.testingsystem.model.User;
import com.testingsystem.repository.SystemConfigRepository;
import com.testingsystem.repository.UserRepository;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SystemConfigRepository systemConfigRepository;

    public UserService(UserRepository userRepository,
                       EmailService emailService,
                       SystemConfigRepository systemConfigRepository) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.systemConfigRepository = systemConfigRepository;
    }

    private String generateVerificationCode() {
        return String.format("%06d", new Random().nextInt(1000000));
    }

    private String hashPassword(String password) {
        return BCrypt.hashpw(password, BCrypt.gensalt());
    }

    private boolean checkPassword(String plainPassword, String hashedPassword) {
        return BCrypt.checkpw(plainPassword, hashedPassword);
    }

    public User register(String name, String email, String password) {
        if (!isRegistrationEnabled()) {
            throw new RuntimeException("Регистрация временно отключена администратором");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Пользователь с таким email уже существует");
        }
        if (password.length() < 8) {
            throw new RuntimeException("Пароль должен содержать минимум 8 символов");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(hashPassword(password));
        user.setRole("USER");
        user.setStatus("PENDING");

        String verificationCode = generateVerificationCode();
        user.setVerificationCode(verificationCode);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusHours(24));

        User savedUser = userRepository.save(user);
        emailService.sendVerificationEmail(email, name, verificationCode);
        return savedUser;
    }

    public User verifyEmail(String code) {
        Optional<User> userOpt = userRepository.findByVerificationCode(code);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Неверный код подтверждения");
        }
        User user = userOpt.get();
        if (user.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Код подтверждения истек. Запросите новый код");
        }
        if (!"PENDING".equals(user.getStatus())) {
            throw new RuntimeException("Email уже подтвержден");
        }
        user.setStatus("ACTIVE");
        user.setVerifiedAt(LocalDateTime.now());
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        return userRepository.save(user);
    }

    public User login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Пользователь не найден");
        }
        User user = userOpt.get();
        if (!checkPassword(password, user.getPassword())) {
            throw new RuntimeException("Неверный пароль");
        }
        if ("PENDING".equals(user.getStatus())) {
            throw new RuntimeException("Email не подтвержден. Проверьте почту");
        }
        if ("BLOCKED".equals(user.getStatus())) {
            throw new RuntimeException("Вы заблокированы. Обращение можете оставить по system_rgr2026@yandex.ru");
        }
        return user;
    }

    public void requestPasswordReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Пользователь с таким email не найден");
        }
        User user = userOpt.get();
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new RuntimeException("Аккаунт не активирован или заблокирован");
        }
        String resetCode = generateVerificationCode();
        user.setVerificationCode(resetCode);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);
        emailService.sendPasswordResetEmail(email, user.getName(), resetCode);
    }

    public User resetPassword(String code, String newPassword) {
        Optional<User> userOpt = userRepository.findByVerificationCode(code);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Неверный код восстановления");
        }
        User user = userOpt.get();
        if (user.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Код восстановления истек");
        }
        if (newPassword.length() < 8) {
            throw new RuntimeException("Новый пароль должен содержать минимум 8 символов");
        }
        user.setPassword(hashPassword(newPassword));
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        return userRepository.save(user);
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }

    public User updateRole(UUID userId, String newRole, UUID currentAdminId) {
        if (userId.equals(currentAdminId)) {
            throw new RuntimeException("Нельзя изменить свою собственную роль");
        }
        if ("ADMIN".equals(newRole)) {
            throw new RuntimeException("Назначение роли Администратор запрещено. Администраторы создаются только через базу данных.");
        }
        User user = getUserById(userId);
        user.setRole(newRole);
        return userRepository.save(user);
    }

    public User toggleStatus(UUID userId, UUID currentAdminId) {
        if (userId.equals(currentAdminId)) {
            throw new RuntimeException("Нельзя изменить свой собственный статус");
        }
        User user = getUserById(userId);
        if ("ACTIVE".equals(user.getStatus())) {
            user.setStatus("BLOCKED");
        } else if ("BLOCKED".equals(user.getStatus())) {
            user.setStatus("ACTIVE");
        } else {
            throw new RuntimeException("Нельзя изменить статус пользователя со статусом: " + user.getStatus());
        }
        return userRepository.save(user);
    }

    public User banUser(UUID userId, UUID currentAdminId) {
        if (userId.equals(currentAdminId)) {
            throw new RuntimeException("Нельзя заблокировать свой собственный аккаунт");
        }
        User user = getUserById(userId);
        user.setStatus("BLOCKED");
        return userRepository.save(user);
    }

    public User unbanUser(UUID userId, UUID currentAdminId) {
        if (userId.equals(currentAdminId)) {
            throw new RuntimeException("Нельзя разблокировать свой собственный аккаунт");
        }
        User user = getUserById(userId);
        user.setStatus("ACTIVE");
        return userRepository.save(user);
    }

    public void deleteUser(UUID userId, UUID currentAdminId) {
        if (userId.equals(currentAdminId)) {
            throw new RuntimeException("Нельзя удалить свой собственный аккаунт");
        }
        userRepository.deleteById(userId);
    }

    public Iterable<User> getAllUsers() {
        return userRepository.findAllOrderByRegisteredAtDesc();
    }

    public User updateUserStats(User user) {
        return userRepository.save(user);
    }

    public void resendVerificationCode(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Пользователь не найден");
        }
        User user = userOpt.get();
        if (!"PENDING".equals(user.getStatus())) {
            throw new RuntimeException("Email уже подтвержден");
        }
        String newCode = generateVerificationCode();
        user.setVerificationCode(newCode);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusHours(24));
        userRepository.save(user);
        emailService.sendVerificationEmail(email, user.getName(), newCode);
    }

    public long getTotalUsersCount() {
        return userRepository.count();
    }

    public void setRegistrationEnabled(boolean enabled) {
        Optional<SystemConfig> config = systemConfigRepository.findByConfigKey("registration.enabled");
        if (config.isPresent()) {
            config.get().setConfigValue(String.valueOf(enabled));
            config.get().setUpdatedAt(LocalDateTime.now());
            systemConfigRepository.save(config.get());
        } else {
            systemConfigRepository.save(new SystemConfig("registration.enabled", String.valueOf(enabled), "Включение/отключение регистрации новых пользователей"));
        }
    }

    public boolean isRegistrationEnabled() {
        Optional<SystemConfig> config = systemConfigRepository.findByConfigKey("registration.enabled");
        if (config.isPresent()) {
            return "true".equals(config.get().getConfigValue());
        }
        systemConfigRepository.save(new SystemConfig("registration.enabled", "true", "Включение/отключение регистрации новых пользователей"));
        return true;
    }
}