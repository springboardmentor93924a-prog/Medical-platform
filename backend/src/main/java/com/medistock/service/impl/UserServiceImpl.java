package com.medistock.service.impl;

import com.medistock.dto.request.ChangePasswordRequest;
import com.medistock.dto.request.RegisterRequest;
import com.medistock.dto.request.UpdateProfileRequest;
import com.medistock.dto.request.UserStatusUpdateRequest;
import com.medistock.dto.response.UserSummaryDto;
import com.medistock.entity.Supplier;
import com.medistock.entity.User;
import com.medistock.enums.Role;
import com.medistock.enums.SupplierStatus;
import com.medistock.enums.UserStatus;
import com.medistock.exception.BadRequestException;
import com.medistock.exception.DuplicateResourceException;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.SupplierRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.AuditLogService;
import com.medistock.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserServiceImpl(UserRepository userRepository,
                           SupplierRepository supplierRepository,
                           PasswordEncoder passwordEncoder,
                           AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    private UserSummaryDto mapToDto(User user) {
        Long supplierId = null;
        if (user.getRole() == Role.SUPPLIER) {
            Supplier supplier = supplierRepository.findByUserId(user.getId()).orElse(null);
            if (supplier != null) {
                supplierId = supplier.getId();
            }
        }
        return new UserSummaryDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getAddress(),
                user.getRole(),
                user.getStatus(),
                supplierId
        );
    }

    @Override
    public List<UserSummaryDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserSummaryDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToDto(user);
    }

    @Override
    @Transactional
    public UserSummaryDto updateUserStatus(Long id, UserStatusUpdateRequest request, String adminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (user.getEmail().equalsIgnoreCase(adminEmail) && request.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("You cannot deactivate or suspend your own administrator account.");
        }

        user.setStatus(request.getStatus());
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }

        User updatedUser = userRepository.save(user);

        // If supplier, also update supplier status if approved
        if (user.getRole() == Role.SUPPLIER) {
            Supplier supplier = supplierRepository.findByUserId(user.getId()).orElse(null);
            if (supplier != null) {
                if (request.getStatus() == UserStatus.ACTIVE) {
                    supplier.setStatus(SupplierStatus.APPROVED);
                } else if (request.getStatus() == UserStatus.REJECTED) {
                    supplier.setStatus(SupplierStatus.REJECTED);
                } else if (request.getStatus() == UserStatus.INACTIVE) {
                    supplier.setStatus(SupplierStatus.SUSPENDED);
                }
                supplierRepository.save(supplier);
            }
        }

        auditLogService.log(adminEmail, Role.ADMIN.name(), "UPDATE_USER_STATUS", "User", user.getId().toString(),
                "Updated user " + user.getEmail() + " status to " + request.getStatus() + (request.getRole() != null ? " and role to " + request.getRole() : ""));

        return mapToDto(updatedUser);
    }

    @Override
    @Transactional
    public UserSummaryDto createUser(RegisterRequest request, String adminEmail) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with email " + request.getEmail() + " already exists.");
        }

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName(),
                request.getPhone(),
                request.getAddress(),
                request.getRole(),
                UserStatus.ACTIVE
        );

        User savedUser = userRepository.save(user);
        Long supplierId = null;

        if (request.getRole() == Role.SUPPLIER) {
            Supplier supplier = new Supplier(
                    request.getCompanyName() != null ? request.getCompanyName() : request.getFullName() + " Supplies",
                    request.getContactPerson() != null ? request.getContactPerson() : request.getFullName(),
                    request.getEmail(),
                    request.getPhone(),
                    request.getAddress() != null ? request.getAddress() : "Address not provided",
                    request.getBusinessRegistrationNumber(),
                    SupplierStatus.APPROVED
            );
            supplier.setUser(savedUser);
            Supplier savedSupplier = supplierRepository.save(supplier);
            supplierId = savedSupplier.getId();
        }

        auditLogService.log(adminEmail, Role.ADMIN.name(), "CREATE_USER", "User", savedUser.getId().toString(),
                "Administrator created user " + savedUser.getEmail() + " with role " + savedUser.getRole());

        return mapToDto(savedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Long id, String adminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (user.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new BadRequestException("You cannot delete your own administrator account.");
        }

        userRepository.delete(user);
        auditLogService.log(adminEmail, Role.ADMIN.name(), "DELETE_USER", "User", id.toString(), "Deleted user " + user.getEmail());
    }

    @Override
    public UserSummaryDto getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return mapToDto(user);
    }

    @Override
    @Transactional
    public UserSummaryDto updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAddress() != null) user.setAddress(request.getAddress());

        User updatedUser = userRepository.save(user);

        if (user.getRole() == Role.SUPPLIER) {
            Supplier supplier = supplierRepository.findByUserId(user.getId()).orElse(null);
            if (supplier != null) {
                if (request.getCompanyName() != null) supplier.setCompanyName(request.getCompanyName());
                if (request.getContactPerson() != null) supplier.setContactPerson(request.getContactPerson());
                if (request.getPhone() != null) supplier.setPhone(request.getPhone());
                if (request.getAddress() != null) supplier.setAddress(request.getAddress());
                if (request.getBusinessRegistrationNumber() != null) supplier.setBusinessRegistrationNumber(request.getBusinessRegistrationNumber());
                supplierRepository.save(supplier);
            }
        }

        auditLogService.log(user.getEmail(), user.getRole().name(), "UPDATE_PROFILE", "User", user.getId().toString(), "Updated profile details");

        return mapToDto(updatedUser);
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password provided does not match our records.");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirmation password do not match.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditLogService.log(user.getEmail(), user.getRole().name(), "CHANGE_PASSWORD", "User", user.getId().toString(), "Password changed successfully");
    }
}
