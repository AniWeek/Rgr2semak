package com.testingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "results")
public class Result {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "test_id", nullable = false)
    private UUID testId;

    private Integer score;

    private Integer pointsEarned = 0; // Набранные баллы
    private Integer pointsTotal = 0;   // Максимальные баллы

    private Double percentage;

    @Column(name = "is_passed")
    private Boolean isPassed = false;

    @Column(name = "time_spent")
    private Integer timeSpent;

    @Column(name = "completed_at")
    private LocalDateTime completedAt = LocalDateTime.now();

    public Boolean getPassed() {
        return isPassed;
    }

    public void setPassed(Boolean passed) {
        this.isPassed = passed;
    }

    public Result(UUID userId, UUID testId, Integer score, Double percentage, Boolean isPassed, Integer timeSpent) {
        this.userId = userId;
        this.testId = testId;
        this.score = score;
        this.percentage = percentage;
        this.isPassed = isPassed;
        this.timeSpent = timeSpent;
        this.completedAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "Result{" +
                "id=" + id +
                ", userId=" + userId +
                ", testId=" + testId +
                ", score=" + score +
                ", pointsEarned=" + pointsEarned +
                ", pointsTotal=" + pointsTotal +
                ", percentage=" + percentage +
                ", isPassed=" + isPassed +
                ", timeSpent=" + timeSpent +
                '}';
    }
}