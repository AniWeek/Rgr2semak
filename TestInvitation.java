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
@Table(name = "test_invitations")
public class TestInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "test_id", nullable = false)
    private UUID testId;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "invited_by")
    private UUID invitedBy;

    @Column(name = "invited_at")
    private LocalDateTime invitedAt = LocalDateTime.now();

    @Column(name = "is_used")
    private Boolean isUsed = false;

    public TestInvitation(UUID testId, String userEmail, UUID invitedBy) {
        this.testId = testId;
        this.userEmail = userEmail;
        this.invitedBy = invitedBy;
        this.invitedAt = LocalDateTime.now();
        this.isUsed = false;
    }
}