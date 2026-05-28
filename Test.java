package com.testingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tests")
public class Test {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer duration;

    private LocalDate deadline;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(nullable = false)
    private String status = "AVAILABLE";

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "max_attempts")
    private Integer maxAttempts;

    @Column(name = "is_private")
    private Boolean isPrivate = false;

    @Column(name = "comments_enabled")
    private Boolean commentsEnabled = false;

    @Column(name = "randomize_questions")
    private Boolean randomizeQuestions = false;

    @Column(name = "allow_navigation_back")
    private Boolean allowNavigationBack = true;

    @Column(name = "allow_skip_questions")
    private Boolean allowSkipQuestions = true;

    @Column(name = "category")
    private String category = "GENERAL";

    @JsonIgnore
    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    private List<Question> questions = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("createdAt DESC")
    private List<TestComment> comments = new ArrayList<>();

    @Transient
    private Integer questionsCount = 0;

    public void addQuestion(Question question) {
        questions.add(question);
        question.setTest(this);
    }

    public void removeQuestion(Question question) {
        questions.remove(question);
        question.setTest(null);
    }

    public void addComment(TestComment comment) {
        comments.add(comment);
        comment.setTest(this);
    }

    public void removeComment(TestComment comment) {
        comments.remove(comment);
        comment.setTest(null);
    }

    public boolean isAvailable() {
        return "AVAILABLE".equals(status) &&
                (deadline == null || !deadline.isBefore(LocalDate.now()));
    }

    public boolean isExpired() {
        return deadline != null && deadline.isBefore(LocalDate.now());
    }

    public int getQuestionsCount() {
        if (questionsCount != null && questionsCount > 0) {
            return questionsCount;
        }
        return questions != null ? questions.size() : 0;
    }

    public void setQuestionsCount(Integer questionsCount) {
        this.questionsCount = questionsCount;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Test(String title, String description, Integer duration, UUID createdBy) {
        this.title = title;
        this.description = description;
        this.duration = duration;
        this.createdBy = createdBy;
        this.status = "AVAILABLE";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.questionsCount = 0;
        this.isPrivate = false;
        this.maxAttempts = null;
        this.commentsEnabled = false;
        this.randomizeQuestions = false;
        this.allowNavigationBack = true;
        this.allowSkipQuestions = true;
        this.category = "GENERAL";
    }

    @Override
    public String toString() {
        return "Test{id=" + id + ", title='" + title + "'}";
    }
}