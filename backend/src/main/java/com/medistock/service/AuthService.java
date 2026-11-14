package com.medistock.service;

import com.medistock.dto.request.*;
import com.medistock.dto.response.ApiResponse;
import com.medistock.dto.response.AuthResponse;
import com.medistock.dto.response.UserSummaryDto;

import java.util.Map;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    UserSummaryDto register(RegisterRequest request);
    UserSummaryDto adminSetup(AdminSetupRequest request);
    ApiResponse<String> forgotPassword(ForgotPasswordRequest request);
    ApiResponse<String> resetPassword(ResetPasswordRequest request);
    AuthResponse refreshToken(RefreshTokenRequest request);
    Map<String, Object> getGoogleAuthStatus();
    AuthResponse googleLogin(Map<String, String> payload);
}
