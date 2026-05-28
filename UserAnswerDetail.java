package com.testingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.UUID;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "user_answer_details")
public class UserAnswerDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "result_id", nullable = false)
    private UUID resultId;

    @Column(name = "question_id", nullable = false)
    private UUID questionId;

    @Column(name = "answer_id")
    private UUID answerId;

    @Column(name = "text_answer")
    private String textAnswer;

    @Column(name = "number_answer")
    private Double numberAnswer;

    @Column(name = "selected_answer_ids")
    private String selectedAnswerIds;

    @Column(name = "is_correct")
    private Boolean isCorrect = false;

    @Column(name = "points_earned")
    private Integer pointsEarned = 0;

    @Column(name = "points_max")
    private Integer pointsMax = 1;
}