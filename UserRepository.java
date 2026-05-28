package com.testingsystem.repository;

import com.testingsystem.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByVerificationCode(String code);

    boolean existsByEmail(String email);

    long countByRole(String role);

    long countByStatus(String status);

    @Query("SELECT u FROM User u ORDER BY u.registeredAt DESC")
    Iterable<User> findAllOrderByRegisteredAtDesc();
}