package com.medistock.service;

import com.medistock.dto.request.ChangePasswordRequest;
import com.medistock.dto.request.RegisterRequest;
import com.medistock.dto.request.UpdateProfileRequest;
import com.medistock.dto.request.UserStatusUpdateRequest;
import com.medistock.dto.response.UserSummaryDto;

import java.util.List;

public interface UserService {
    List<UserSummaryDto> getAllUsers();
    UserSummaryDto getUserById(Long id);
    UserSummaryDto updateUserStatus(Long id, UserStatusUpdateRequest request, String adminEmail);
    UserSummaryDto createUser(RegisterRequest request, String adminEmail);
    void deleteUser(Long id, String adminEmail);
    UserSummaryDto getProfile(String email);
    UserSummaryDto updateProfile(String email, UpdateProfileRequest request);
    void changePassword(String email, ChangePasswordRequest request);
}
