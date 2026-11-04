
package com.medistock.controller;

import com.medistock.entity.User;
import com.medistock.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/profile")
@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
public class ProfileController {

    private final UserRepository userRepository;

    public ProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public record ProfileResponse(
            Long userId,
            String fullName,
            String email,
            String phone,
            String role,
            String profilePicture
    ) {}

    public record UpdateProfileRequest(
            String fullName,
            String phone,
            String profilePicture
    ) {}

    @GetMapping
    @Transactional(readOnly = true)
    public ProfileResponse getMyProfile(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return toResponse(user);
    }

    @PutMapping
    @Transactional
    public ProfileResponse updateMyProfile(
            @RequestBody UpdateProfileRequest request,
            Authentication authentication) {

        if (request == null ||
                request.fullName() == null ||
                request.fullName().trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Full name cannot be empty"
            );
        }

        if (request.fullName().trim().length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Full name cannot exceed 100 characters"
            );
        }

        if (request.phone() != null &&
                request.phone().trim().length() > 30) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Phone cannot exceed 30 characters"
            );
        }

        User user = getCurrentUser(authentication);

        user.setFullName(request.fullName().trim());

        user.setPhone(
                request.phone() == null || request.phone().trim().isEmpty()
                        ? null
                        : request.phone().trim()
        );

        // Update the picture only when the request explicitly includes it.
        // null = keep existing picture.
        // Empty string = remove existing picture.
        // Base64 data URL = save new picture.
        String picture = request.profilePicture();

        if (picture != null) {
            if (picture.isBlank()) {
                user.setProfilePicture(null);
            } else {
                if (!picture.startsWith("data:image/")) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Invalid image format"
                    );
                }

                if (picture.length() > 7_000_000) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Image must be smaller than approximately 5 MB"
                    );
                }

                user.setProfilePicture(picture);
            }
        }

        User updatedUser = userRepository.save(user);

        return toResponse(updatedUser);
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null ||
                !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user not found"
                ));
    }

    private ProfileResponse toResponse(User user) {
        String roleName = user.getRole() != null
                ? user.getRole().getRoleName()
                : "UNKNOWN";

        return new ProfileResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                roleName,
                user.getProfilePicture()
        );
    }
}
