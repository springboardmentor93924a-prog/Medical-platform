package com.medistock.service;

import com.medistock.dto.request.LoginRequest;
import com.medistock.dto.request.RegisterRequest;
import com.medistock.dto.response.AuthResponse;
import com.medistock.dto.response.UserSummaryDto;
import com.medistock.entity.User;
import com.medistock.enums.Role;
import com.medistock.enums.UserStatus;
import com.medistock.exception.BadRequestException;
import com.medistock.exception.DuplicateResourceException;
import com.medistock.exception.UnauthorizedException;
import com.medistock.repository.PasswordResetTokenRepository;
import com.medistock.repository.SupplierRepository;
import com.medistock.repository.UserRepository;
import com.medistock.security.JwtUtils;
import com.medistock.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Timeout(value = 10, unit = TimeUnit.SECONDS)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    private PasswordEncoder passwordEncoder;
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder(4);
        authService = new AuthServiceImpl(
                userRepository,
                supplierRepository,
                passwordResetTokenRepository,
                passwordEncoder,
                authenticationManager,
                jwtUtils,
                notificationService,
                auditLogService
        );
    }

    @Test
    @DisplayName("Should successfully register a new Pharmacist with BCrypt password")
    void testSuccessfulPharmacistRegistration() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("John Pharmacist");
        request.setEmail("john.pharm@medistock.com");
        request.setPhone("+1234567890");
        request.setPassword("SecureP@ssword123");
        request.setConfirmPassword("SecureP@ssword123");
        request.setRole(Role.PHARMACIST);
        request.setAddress("123 Healthcare Ave");

        when(userRepository.existsByEmail("john.pharm@medistock.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(101L);
            return u;
        });

        UserSummaryDto result = authService.register(request);

        assertNotNull(result);
        assertEquals("john.pharm@medistock.com", result.getEmail());
        assertEquals(Role.PHARMACIST, result.getRole());
        verify(userRepository).save(argThat(u ->
                passwordEncoder.matches("SecureP@ssword123", u.getPassword())
        ));
    }

    @Test
    @DisplayName("Should reject duplicate email registration")
    void testDuplicateEmailRegistration() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("duplicate@medistock.com");
        request.setPassword("Password123!");
        request.setConfirmPassword("Password123!");
        request.setRole(Role.STAFF);

        when(userRepository.existsByEmail("duplicate@medistock.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should reject registration with mismatched passwords")
    void testPasswordMismatch() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("user@medistock.com");
        request.setPassword("Password123!");
        request.setConfirmPassword("DifferentPassword!");
        request.setRole(Role.STAFF);

        assertThrows(BadRequestException.class, () -> authService.register(request));
    }

    @Test
    @DisplayName("Should successfully register a new Administrator with BCrypt password")
    void testSuccessfulAdminRegistration() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Platform Administrator");
        request.setEmail("new.admin@medistock.com");
        request.setPhone("+1987654321");
        request.setPassword("AdminSecureP@ss1");
        request.setConfirmPassword("AdminSecureP@ss1");
        request.setRole(Role.ADMIN);
        request.setAddress("HQ Suite 100");

        when(userRepository.existsByEmail("new.admin@medistock.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(201L);
            return u;
        });

        UserSummaryDto result = authService.register(request);

        assertNotNull(result);
        assertEquals("new.admin@medistock.com", result.getEmail());
        assertEquals(Role.ADMIN, result.getRole());
        verify(userRepository).save(argThat(u ->
                passwordEncoder.matches("AdminSecureP@ss1", u.getPassword())
        ));
    }

    @Test
    @DisplayName("Should successfully login active user and generate JWT tokens")
    void testSuccessfulLogin() {
        LoginRequest request = new LoginRequest("active.user@medistock.com", "MyP@ssword123");
        User user = new User("active.user@medistock.com", passwordEncoder.encode("MyP@ssword123"), "Active User", "123456", "Address", Role.STAFF, UserStatus.ACTIVE);
        user.setId(50L);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(userRepository.findByEmail("active.user@medistock.com")).thenReturn(Optional.of(user));
        when(jwtUtils.generateAccessToken("active.user@medistock.com", Role.STAFF, 50L)).thenReturn("mock-access-token");
        when(jwtUtils.generateRefreshToken("active.user@medistock.com")).thenReturn("mock-refresh-token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertEquals("mock-refresh-token", response.getRefreshToken());
        assertEquals("active.user@medistock.com", response.getUser().getEmail());
    }

    @Test
    @DisplayName("Should block login for pending supplier before admin approval")
    void testPendingSupplierLoginBlocked() {
        LoginRequest request = new LoginRequest("pending.supp@medistock.com", "Password123!");
        User user = new User("pending.supp@medistock.com", passwordEncoder.encode("Password123!"), "Pending Supp", "123", "Addr", Role.SUPPLIER, UserStatus.PENDING);
        user.setId(70L);

        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(userRepository.findByEmail("pending.supp@medistock.com")).thenReturn(Optional.of(user));

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> authService.login(request));
        assertTrue(ex.getMessage().contains("pending administrator approval"));
    }

    @Test
    @DisplayName("Should safely handle forgot password for non-existent email without leaking account info")
    void testForgotPasswordNonExistentEmail() {
        com.medistock.dto.request.ForgotPasswordRequest request = new com.medistock.dto.request.ForgotPasswordRequest();
        request.setEmail("unknown@medistock.com");

        when(userRepository.findByEmail("unknown@medistock.com")).thenReturn(Optional.empty());

        com.medistock.dto.response.ApiResponse<String> response = authService.forgotPassword(request);
        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("If an account exists"));
        assertNull(response.getData());
    }

    @Test
    @DisplayName("Should generate reset token for valid forgot password request")
    void testForgotPasswordValidUser() {
        com.medistock.dto.request.ForgotPasswordRequest request = new com.medistock.dto.request.ForgotPasswordRequest();
        request.setEmail("registered@medistock.com");
        User user = new User("registered@medistock.com", "hash", "Registered User", "123", "Addr", Role.STAFF, UserStatus.ACTIVE);
        user.setId(88L);

        when(userRepository.findByEmail("registered@medistock.com")).thenReturn(Optional.of(user));

        com.medistock.dto.response.ApiResponse<String> response = authService.forgotPassword(request);
        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertNotNull(response.getData());
        verify(passwordResetTokenRepository).save(any());
    }
}
