package com.testingsystem.repository;

import com.testingsystem.model.TestInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TestInvitationRepository extends JpaRepository<TestInvitation, UUID> {

    List<TestInvitation> findByTestId(UUID testId);

    List<TestInvitation> findByUserEmail(String userEmail);

    Optional<TestInvitation> findByTestIdAndUserEmail(UUID testId, String userEmail);

    boolean existsByTestIdAndUserEmail(UUID testId, String userEmail);

    void deleteByTestId(UUID testId);

    void deleteByUserEmail(String userEmail);
}