package com.medistock.service.impl;

import com.medistock.dto.request.AdminSetupRequest;
import com.medistock.dto.request.ChangePasswordRequest;
import com.medistock.dto.request.ForgotPasswordRequest;
import com.medistock.dto.request.LoginRequest;
import com.medistock.dto.request.RefreshTokenRequest;
import com.medistock.dto.request.RegisterRequest;
import com.medistock.dto.request.ResetPasswordRequest;
import com.medistock.dto.response.ApiResponse;
import com.medistock.dto.response.AuthResponse;
import com.medistock.dto.response.UserSummaryDto;
import com.medistock.entity.PasswordResetToken;
import com.medistock.entity.Supplier;
import com.medistock.entity.User;
import com.medistock.enums.AuthProvider;
import com.medistock.enums.NotificationType;
import com.medistock.enums.Role;
import com.medistock.enums.SupplierStatus;
import com.medistock.enums.UserStatus;
import com.medistock.exception.BadRequestException;
import com.medistock.exception.DuplicateResourceException;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.exception.UnauthorizedException;
import com.medistock.repository.PasswordResetTokenRepository;
import com.medistock.repository.SupplierRepository;
import com.medistock.repository.UserRepository;
import com.medistock.security.JwtUtils;
import com.medistock.service.AuditLogService;
import com.medistock.service.AuthService;
import com.medistock.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Value("${app.admin.setup-key:MediStockAdminSecretSetupKey2026!}")
    private String adminSetupKey;

    @Value("${app.registration.pharmacist-requires-approval:false}")
    private boolean pharmacistApprovalRequired;

    @Value("${app.registration.staff-requires-approval:false}")
    private boolean staffApprovalRequired;

    @Value("${app.registration.supplier-requires-approval:false}")
    private boolean supplierApprovalRequired;

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret:}")
    private String googleClientSecret;

    public AuthServiceImpl(UserRepository userRepository,
                           SupplierRepository supplierRepository,
                           PasswordResetTokenRepository passwordResetTokenRepository,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager,
                           JwtUtils jwtUtils,
                           NotificationService notificationService,
                           AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("User not found with email: " + request.getEmail()));

        if (user.getStatus() == UserStatus.PENDING) {
            throw new UnauthorizedException("Your account registration is pending administrator approval. Please wait for an administrator to activate your account.");
        } else if (user.getStatus() == UserStatus.REJECTED) {
            throw new UnauthorizedException("Your registration request was rejected by the administrator.");
        } else if (user.getStatus() == UserStatus.INACTIVE) {
            throw new UnauthorizedException("Your account is currently inactive. Please contact your system administrator.");
        }

        Long supplierId = null;
        if (user.getRole() == Role.SUPPLIER) {
            Supplier supplier = supplierRepository.findByUserId(user.getId())
                    .or(() -> supplierRepository.findByUserEmail(user.getEmail()))
                    .or(() -> supplierRepository.findByEmail(user.getEmail()))
                    .orElse(null);
            if (supplier != null) {
                if (supplier.getUser() == null) {
                    supplier.setUser(user);
                    supplierRepository.save(supplier);
                }
                supplierId = supplier.getId();
                if (supplier.getStatus() == SupplierStatus.PENDING) {
                    throw new UnauthorizedException("Your Supplier business profile is pending administrator verification and approval.");
                } else if (supplier.getStatus() == SupplierStatus.REJECTED || supplier.getStatus() == SupplierStatus.SUSPENDED) {
                    throw new UnauthorizedException("Supplier account is " + supplier.getStatus().name() + ". Access to business operations is restricted.");
                }
            } else {
                logger.warn("Supplier user {} has no linked supplier entity, auto-generating vendor profile", user.getEmail());
                Supplier newSupplier = new Supplier(
                        user.getFullName() + " Supplies",
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhone() != null ? user.getPhone() : "N/A",
                        user.getAddress() != null ? user.getAddress() : "Not provided",
                        "REG-" + user.getId(),
                        SupplierStatus.APPROVED
                );
                newSupplier.setUser(user);
                Supplier saved = supplierRepository.save(newSupplier);
                supplierId = saved.getId();
            }
        }

        String accessToken = jwtUtils.generateAccessToken(user.getEmail(), user.getRole(), user.getId());
        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail());

        auditLogService.log(user.getEmail(), user.getRole().name(), "LOGIN", "User", user.getId().toString(), "User logged in successfully");

        UserSummaryDto userSummary = new UserSummaryDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getAddress(),
                user.getRole(),
                user.getStatus(),
                supplierId
        );

        return new AuthResponse(accessToken, refreshToken, userSummary);
    }

    @Override
    @Transactional
    public UserSummaryDto register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Password and confirm password do not match.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with email " + request.getEmail() + " already exists.");
        }

        UserStatus userStatus;
        if (request.getRole() == Role.SUPPLIER) {
            userStatus = supplierApprovalRequired ? UserStatus.PENDING : UserStatus.ACTIVE;
        } else if (request.getRole() == Role.PHARMACIST) {
            userStatus = pharmacistApprovalRequired ? UserStatus.PENDING : UserStatus.ACTIVE;
        } else if (request.getRole() == Role.STAFF) {
            userStatus = staffApprovalRequired ? UserStatus.PENDING : UserStatus.ACTIVE;
        } else {
            userStatus = UserStatus.ACTIVE;
        }

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName(),
                request.getPhone(),
                request.getAddress(),
                request.getRole(),
                userStatus
        );

        User savedUser = userRepository.save(user);
        Long supplierId = null;

        if (request.getRole() == Role.SUPPLIER) {
            if (request.getCompanyName() == null || request.getCompanyName().isBlank()) {
                throw new BadRequestException("Company name is required for supplier registration.");
            }
            if (supplierRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateResourceException("A supplier profile with email " + request.getEmail() + " already exists.");
            }

            Supplier supplier = new Supplier(
                    request.getCompanyName(),
                    request.getContactPerson() != null && !request.getContactPerson().isBlank() ? request.getContactPerson() : request.getFullName(),
                    request.getEmail(),
                    request.getPhone(),
                    request.getAddress() != null ? request.getAddress() : "Not provided",
                    request.getBusinessRegistrationNumber(),
                    supplierApprovalRequired ? SupplierStatus.PENDING : SupplierStatus.APPROVED
            );
            supplier.setUser(savedUser);
            Supplier savedSupplier = supplierRepository.save(supplier);
            supplierId = savedSupplier.getId();

            notificationService.sendNotification(
                    null,
                    Role.ADMIN,
                    "New Supplier Registration",
                    "Supplier '" + supplier.getCompanyName() + "' (" + user.getEmail() + ") registered and requires administrator approval.",
                    NotificationType.SUPPLIER_APPROVAL
            );
        } else {
            notificationService.sendNotification(
                    null,
                    Role.ADMIN,
                    "New User Registration",
                    user.getFullName() + " registered as " + user.getRole().name() + " (Status: " + user.getStatus().name() + ").",
                    NotificationType.SYSTEM
            );
        }

        auditLogService.log(savedUser.getEmail(), savedUser.getRole().name(), "REGISTER", "User", savedUser.getId().toString(), "New user registered with role " + savedUser.getRole().name());

        return new UserSummaryDto(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                savedUser.getPhone(),
                savedUser.getAddress(),
                savedUser.getRole(),
                savedUser.getStatus(),
                supplierId
        );
    }

    @Override
    @Transactional
    public UserSummaryDto adminSetup(AdminSetupRequest request) {
        if (!adminSetupKey.equals(request.getSetupKey())) {
            throw new UnauthorizedException("Invalid admin setup key.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with email " + request.getEmail() + " already exists.");
        }

        User admin = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName(),
                null,
                null,
                Role.ADMIN,
                UserStatus.ACTIVE
        );

        User savedAdmin = userRepository.save(admin);
        auditLogService.log(savedAdmin.getEmail(), Role.ADMIN.name(), "ADMIN_SETUP", "User", savedAdmin.getId().toString(), "Initial admin account created via setup key");

        return new UserSummaryDto(
                savedAdmin.getId(),
                savedAdmin.getEmail(),
                savedAdmin.getFullName(),
                savedAdmin.getPhone(),
                savedAdmin.getAddress(),
                savedAdmin.getRole(),
                savedAdmin.getStatus(),
                null
        );
    }

    @Override
    @Transactional
    public ApiResponse<String> forgotPassword(ForgotPasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BadRequestException("Registered email is required.");
        }

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().trim().toLowerCase());
        if (userOpt.isEmpty()) {
            return ApiResponse.success("If an account exists with that email address, password reset instructions have been sent.", null);
        }

        User user = userOpt.get();
        passwordResetTokenRepository.deleteByUser(user);

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(token, user, LocalDateTime.now().plusHours(1));
        passwordResetTokenRepository.save(resetToken);

        String note = "Password reset token generated successfully.";
        auditLogService.log(user.getEmail(), user.getRole().name(), "FORGOT_PASSWORD", "User", user.getId().toString(), "Password reset token generated");

        return ApiResponse.success(note, token);
    }

    @Override
    @Transactional
    public ApiResponse<String> resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Password and confirm password do not match.");
        }

        PasswordResetToken token = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or unrecognized password reset token."));

        if (token.getUsed()) {
            throw new BadRequestException("This password reset token has already been used.");
        }

        if (token.isExpired()) {
            throw new BadRequestException("This password reset token has expired. Please request a new one.");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);

        auditLogService.log(user.getEmail(), user.getRole().name(), "RESET_PASSWORD", "User", user.getId().toString(), "Password reset completed successfully");

        return ApiResponse.success("Password has been successfully updated. You may now log in with your new password.", null);
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        if (!jwtUtils.validateToken(token)) {
            throw new UnauthorizedException("Invalid or expired refresh token.");
        }

        String email = jwtUtils.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found for refresh token: " + email));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("Account is not active.");
        }

        Long supplierId = null;
        if (user.getRole() == Role.SUPPLIER) {
            Supplier supplier = supplierRepository.findByUserId(user.getId()).orElse(null);
            if (supplier != null) {
                supplierId = supplier.getId();
            }
        }

        String newAccessToken = jwtUtils.generateAccessToken(user.getEmail(), user.getRole(), user.getId());
        String newRefreshToken = jwtUtils.generateRefreshToken(user.getEmail());

        UserSummaryDto userSummary = new UserSummaryDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getAddress(),
                user.getRole(),
                user.getStatus(),
                supplierId
        );

        return new AuthResponse(newAccessToken, newRefreshToken, userSummary);
    }

    @Override
    public Map<String, Object> getGoogleAuthStatus() {
        Map<String, Object> status = new HashMap<>();
        boolean configured = googleClientId != null && !googleClientId.isBlank() && !googleClientId.startsWith("your-")
                && googleClientSecret != null && !googleClientSecret.isBlank() && !googleClientSecret.startsWith("your-");
        status.put("configured", configured);
        status.put("message", configured
                ? "Google OAuth2 is active and configured."
                : "Google OAuth2 is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables to enable Google sign-in.");
        return status;
    }

    @Override
    @Transactional
    public AuthResponse googleLogin(Map<String, String> payload) {
        String email = payload.get("email");
        String name = payload.get("name");
        String googleId = payload.get("googleId");
        String credential = payload.get("credential"); // Google ID token from GIS
        if (credential == null) {
            credential = payload.get("idToken");
        }

        // If ID Token is provided, parse and validate Google JWT claims
        if (credential != null && !credential.isBlank()) {
            try {
                String[] parts = credential.split("\\.");
                if (parts.length >= 2) {
                    byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
                    Map<String, Object> claims = new ObjectMapper().readValue(decoded, Map.class);

                    String tokenEmail = (String) claims.get("email");
                    String tokenName = (String) claims.get("name");
                    String tokenSub = (String) claims.get("sub");
                    Object verified = claims.get("email_verified");

                    boolean isEmailVerified = verified instanceof Boolean ? (Boolean) verified : "true".equalsIgnoreCase(String.valueOf(verified));
                    if (!isEmailVerified) {
                        throw new BadRequestException("Google email address is not verified by Google.");
                    }

                    if (tokenEmail != null && !tokenEmail.isBlank()) {
                        email = tokenEmail;
                    }
                    if (tokenName != null && !tokenName.isBlank()) {
                        name = tokenName;
                    }
                    if (tokenSub != null && !tokenSub.isBlank()) {
                        googleId = tokenSub;
                    }
                }
            } catch (Exception e) {
                logger.warn("Could not parse Google ID token claims: {}", e.getMessage());
            }
        }

        if (email == null || email.isBlank()) {
            throw new BadRequestException("Google email is required for authentication.");
        }

        // Existing user vs New user
        Optional<User> existingUserOpt = userRepository.findByEmail(email.trim().toLowerCase());
        User user;

        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new UnauthorizedException("Your account is " + user.getStatus().name().toLowerCase() + ". Please contact the administrator.");
            }
            if (user.getAuthProvider() == null || user.getAuthProvider() == AuthProvider.LOCAL) {
                user.setAuthProvider(AuthProvider.GOOGLE);
                if (googleId != null) user.setProviderId(googleId);
                userRepository.save(user);
            }
        } else {
            user = new User();
            user.setEmail(email.trim().toLowerCase());
            user.setFullName(name != null && !name.isBlank() ? name.trim() : "Google User");
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setRole(Role.STAFF); // Google registrations default strictly to STAFF (no auto-admin)
            user.setStatus(UserStatus.ACTIVE);
            user.setAuthProvider(AuthProvider.GOOGLE);
            user.setProviderId(googleId != null ? googleId : UUID.randomUUID().toString());
            user = userRepository.save(user);
        }

        Long supplierId = null;
        if (user.getRole() == Role.SUPPLIER) {
            Supplier supplier = supplierRepository.findByUserId(user.getId()).orElse(null);
            if (supplier != null) {
                supplierId = supplier.getId();
            }
        }

        auditLogService.log(user.getEmail(), user.getRole().name(), "LOGIN_GOOGLE", "User", user.getId().toString(),
                "User signed in successfully via Google OAuth2 identity provider");

        String accessToken = jwtUtils.generateAccessToken(user.getEmail(), user.getRole(), user.getId());
        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail());

        UserSummaryDto summary = new UserSummaryDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getAddress(),
                user.getRole(),
                user.getStatus(),
                supplierId
        );

        return new AuthResponse(accessToken, refreshToken, summary);
    }
}
