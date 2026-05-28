package com.testingsystem.repository;

import com.testingsystem.model.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ResultRepository extends JpaRepository<Result, UUID> {

    List<Result> findByUserId(UUID userId);

    List<Result> findByTestId(UUID testId);

    List<Result> findByUserIdAndTestId(UUID userId, UUID testId);

    List<Result> findByUserIdOrderByCompletedAtDesc(UUID userId);

    List<Result> findByTestIdOrderByCompletedAtDesc(UUID testId);

    long countByUserIdAndTestId(UUID userId, UUID testId);

    boolean existsByUserIdAndTestId(UUID userId, UUID testId);

    @Query("SELECT AVG(r.percentage) FROM Result r WHERE r.testId = :testId")
    Double getAverageScoreForTest(@Param("testId") UUID testId);

    @Query("SELECT AVG(r.percentage) FROM Result r")
    Double getAverageScoreForAllTests();

    @Query("SELECT COUNT(r) FROM Result r WHERE r.testId = :testId AND r.isPassed = true")
    long countPassedResultsByTestId(@Param("testId") UUID testId);

    @Query("SELECT COUNT(r) FROM Result r WHERE r.completedAt BETWEEN :start AND :end")
    long countByCompletedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('MONTH', r.completedAt) as month, COUNT(r) FROM Result r GROUP BY FUNCTION('MONTH', r.completedAt) ORDER BY FUNCTION('MONTH', r.completedAt)")
    List<Object[]> getMonthlyStats();

    @Query(value = "SELECT r.test_id, t.title, COUNT(r.id) as attempts, AVG(r.percentage) as avg_score, " +
            "(COUNT(CASE WHEN r.is_passed = true THEN 1 END) * 100.0 / COUNT(r.id)) as pass_rate " +
            "FROM results r JOIN tests t ON r.test_id = t.id " +
            "GROUP BY r.test_id, t.title " +
            "ORDER BY attempts DESC LIMIT :limit", nativeQuery = true)
    List<Object[]> getTopTestsByAttempts(@Param("limit") int limit);

    @Query("SELECT COUNT(DISTINCT r.testId) FROM Result r")
    long countDistinctTestIdsWithResults();

    @Query(value = "SELECT COUNT(DISTINCT r.test_id) FROM results r " +
            "WHERE r.user_id NOT IN (SELECT u.id FROM users u WHERE u.role = 'ADMIN') " +
            "AND r.test_id NOT IN (SELECT t.id FROM tests t WHERE t.created_by = r.user_id)",
            nativeQuery = true)
    long countDistinctTestIdsWithResultsExcludingAdminsAndCreators();

    @Query("SELECT r, u FROM Result r JOIN User u ON r.userId = u.id WHERE r.testId = :testId ORDER BY r.completedAt DESC")
    List<Object[]> findResultsWithUsersByTestId(@Param("testId") UUID testId);

    @Query("SELECT r.testId, COUNT(r) FROM Result r GROUP BY r.testId")
    List<Object[]> getAttemptsCountByTest();

    @Query("SELECT AVG(r.percentage) FROM Result r WHERE r.testId = :testId AND r.completedAt BETWEEN :startDate AND :endDate")
    Double getAverageScoreForTestInDateRange(@Param("testId") UUID testId,
                                             @Param("startDate") LocalDateTime startDate,
                                             @Param("endDate") LocalDateTime endDate);

    @Query("SELECT DATE(r.completedAt), COUNT(r) FROM Result r GROUP BY DATE(r.completedAt) ORDER BY DATE(r.completedAt) DESC")
    List<Object[]> getDailyStats();

    @Query("SELECT r FROM Result r WHERE r.userId = :userId AND r.testId = :testId ORDER BY r.percentage DESC")
    List<Result> findBestUserResultsForTest(@Param("userId") UUID userId, @Param("testId") UUID testId);

    @Query("SELECT COUNT(DISTINCT r.userId) FROM Result r WHERE r.testId = :testId")
    long countUniqueUsersByTestId(@Param("testId") UUID testId);

    @Query("SELECT SUM(r.pointsEarned) FROM Result r WHERE r.testId = :testId")
    Integer getTotalPointsEarnedForTest(@Param("testId") UUID testId);

    @Query("SELECT SUM(r.pointsTotal) FROM Result r WHERE r.testId = :testId")
    Integer getTotalPointsMaxForTest(@Param("testId") UUID testId);
}