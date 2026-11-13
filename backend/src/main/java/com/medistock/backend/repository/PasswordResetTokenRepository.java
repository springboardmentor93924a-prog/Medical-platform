package com.medistock.backend.repository;

import com.medistock.backend.entity.PasswordResetToken;
import com.medistock.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);
    void deleteByUser(User user);   // call from a @Transactional method
}
