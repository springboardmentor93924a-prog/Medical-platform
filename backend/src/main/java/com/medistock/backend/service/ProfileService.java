package com.medistock.backend.service;

import com.medistock.backend.dto.AuthDtos.UserResponse;
import com.medistock.backend.dto.ProfileDtos.*;
import com.medistock.backend.entity.User;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.Instant;

@Service
public class ProfileService {
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_TIME = Duration.ofMinutes(15);

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public ProfileService(UserRepository users, PasswordEncoder encoder) {
        this.users = users; this.encoder = encoder;
    }

    @Transactional
    public UserResponse update(String username, ProfileUpdateRequest r) {
        User u = find(username);
        u.setFullName(r.fullName().trim());
        u.setPhone(r.phone().trim());
        return toDto(u);
    }

    // No @Transactional on purpose: wrong-attempt counters must be saved even though we throw afterwards.
    // A wrong current password is a 400, not a 401, because a 401 would sign the user out in the app.
    public void changePassword(String username, ChangePasswordRequest r) {
        User u = find(username);
        if (u.getLockedUntil() != null && u.getLockedUntil().isAfter(Instant.now()))
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many failed attempts. Try again in 15 minutes.");

        if (!encoder.matches(r.currentPassword(), u.getPasswordHash())) {
            u.setFailedAttempts(u.getFailedAttempts() + 1);
            if (u.getFailedAttempts() >= MAX_ATTEMPTS) {
                u.setLockedUntil(Instant.now().plus(LOCK_TIME));
                u.setFailedAttempts(0);
            }
            users.save(u);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect", "currentPassword");
        }
        if (encoder.matches(r.newPassword(), u.getPasswordHash()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "New password must be different from the current one", "newPassword");

        u.setPasswordHash(encoder.encode(r.newPassword()));
        u.setFailedAttempts(0);
        u.setLockedUntil(null);
        users.save(u);
    }

    private User find(String username) {
        return users.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required"));
    }

    private static UserResponse toDto(User u) {
        String role = u.getRole().name().charAt(0) + u.getRole().name().substring(1).toLowerCase();
        return new UserResponse(u.getId(), u.getUsername(), u.getEmail(), u.getFullName(), u.getPhone(), role);
    }
}
