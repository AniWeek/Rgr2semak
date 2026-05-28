package com.testingsystem.repository;

import com.testingsystem.model.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TestRepository extends JpaRepository<Test, UUID> {

    List<Test> findByStatus(String status);

    List<Test> findByCreatedBy(UUID createdBy);

    List<Test> findByTitleContainingIgnoreCase(String title);

    List<Test> findAllByOrderByCreatedAtDesc();

    List<Test> findByStatusIn(List<String> statuses);

    boolean existsByTitle(String title);

    @Query("SELECT t FROM Test t WHERE t.status = 'AVAILABLE' AND (t.deadline IS NULL OR t.deadline >= CURRENT_DATE)")
    List<Test> findAvailableTests();

    @Query("SELECT t FROM Test t WHERE t.status = 'AVAILABLE' AND t.deadline IS NOT NULL AND t.deadline < CURRENT_DATE")
    List<Test> findExpiredTests();

    @Modifying
    @Transactional
    @Query("UPDATE Test t SET t.status = 'EXPIRED' WHERE t.status = 'AVAILABLE' AND t.deadline < CURRENT_DATE")
    void updateExpiredTestsStatus();

    @Query("SELECT COUNT(t) FROM Test t")
    long getTotalTestsCount();

    @Query("SELECT t.status, COUNT(t) FROM Test t GROUP BY t.status")
    List<Object[]> getTestsCountByStatus();

    long countByCreatedBy(UUID createdBy);

    List<Test> findByDeadlineBetween(LocalDate startDate, LocalDate endDate);

    List<Test> findByCreatedByOrderByCreatedAtDesc(UUID createdBy);

    @Query("SELECT DISTINCT t FROM Test t JOIN t.questions q WHERE q IS NOT NULL")
    List<Test> findTestsWithQuestions();

    @Query("SELECT t FROM Test t WHERE t.questions IS EMPTY")
    List<Test> findTestsWithoutQuestions();

    @Query("SELECT t.category, COUNT(t) FROM Test t GROUP BY t.category")
    List<Object[]> getTestsCountByCategory();

    @Query("SELECT t.category, COUNT(t) FROM Test t WHERE t.createdBy = :userId GROUP BY t.category")
    List<Object[]> getTestsCountByCategoryForUser(@Param("userId") UUID userId);
}