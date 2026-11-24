package com.medistock.medistock.repository;

import com.medistock.medistock.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByEmailOrderByCreatedAtDesc(String email);
    Optional<OtpVerification> findTopByPhoneOrderByCreatedAtDesc(String phone);
    Optional<OtpVerification> findTopByUserIdOrderByCreatedAtDesc(Integer userId);
}

