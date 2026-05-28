package com.testingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;
    private String email;
    private String password;
    private String role;
    private String status;

    private String verificationCode;
    private LocalDateTime verificationCodeExpiry;

    private Integer testsCompleted = 0;
    private Double avgScore = 0.0;
    private Integer totalPoints = 0;

    private LocalDateTime registeredAt = LocalDateTime.now();
    private LocalDateTime verifiedAt;
}