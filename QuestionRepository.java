package com.testingsystem.repository;

import com.testingsystem.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {
    
    List<Question> findByTestId(UUID testId);
    
    List<Question> findByTestIdOrderBySortOrder(UUID testId);
    
    long countByTestId(UUID testId);
    
    void deleteByTestId(UUID testId);
}