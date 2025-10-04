package com.example.expenseapproval.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.expenseapproval.model.PasswordResetToken;
import com.example.expenseapproval.model.PasswordResetToken.PasswordResetTokenId;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, PasswordResetTokenId> {
    Optional<PasswordResetToken> findByIdToken(String token);
    void deleteByUserId(Long userId);
}