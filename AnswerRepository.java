package com.testingsystem.repository;

import com.testingsystem.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, UUID> {

    List<Answer> findByQuestionId(UUID questionId);

    List<Answer> findByQuestionIdOrderBySortOrder(UUID questionId);

    List<Answer> findByQuestionIdAndIsCorrectTrue(UUID questionId);

    long countByQuestionIdAndIsCorrectTrue(UUID questionId);

    void deleteByQuestionId(UUID questionId);
}