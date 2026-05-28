package com.testingsystem.repository;

import com.testingsystem.model.TestComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Repository
public interface TestCommentRepository extends JpaRepository<TestComment, UUID> {

    List<TestComment> findByTestIdOrderByCreatedAtDesc(UUID testId);

    List<TestComment> findByTest(com.testingsystem.model.Test test);

    @Transactional
    void deleteByTestId(UUID testId);
}