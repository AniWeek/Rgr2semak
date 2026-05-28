package com.testingsystem.repository;

import com.testingsystem.model.UserAnswerDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserAnswerDetailRepository extends JpaRepository<UserAnswerDetail, UUID> {

    List<UserAnswerDetail> findByResultId(UUID resultId);

    List<UserAnswerDetail> findByQuestionId(UUID questionId);

    @Transactional
    void deleteByResultId(UUID resultId);

    @Transactional
    void deleteByQuestionId(UUID questionId);
}