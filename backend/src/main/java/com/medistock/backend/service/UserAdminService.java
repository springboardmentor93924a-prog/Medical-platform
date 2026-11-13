package com.medistock.backend.service;

import com.medistock.backend.dto.UserDtos.*;
import com.medistock.backend.entity.Role;
import com.medistock.backend.entity.Supplier;
import com.medistock.backend.entity.User;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.SupplierRepository;
import com.medistock.backend.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class UserAdminService {
    private final UserRepository users;
    private final SupplierRepository suppliers;

    public UserAdminService(UserRepository users, SupplierRepository suppliers) {
        this.users = users; this.suppliers = suppliers;
    }

    @Transactional(readOnly = true)
    public List<UserSummary> list() {
        return users.findAll(Sort.by("username")).stream().map(UserAdminService::toDto).toList();
    }

    @Transactional
    public UserSummary update(Long id, UserUpdateRequest r, String actingUsername) {
        User u = users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        Role newRole = Role.valueOf(r.role().trim().toUpperCase());

        // An admin cannot lock themselves out
        if (u.getUsername().equalsIgnoreCase(actingUsername) && (newRole != u.getRole() || !r.active()))
            throw new ApiException(HttpStatus.CONFLICT, "You cannot change your own role or deactivate your own account");

        // There must always be at least one active admin
        boolean losesAdmin = u.getRole() == Role.ADMIN && u.isEnabled() && (newRole != Role.ADMIN || !r.active());
        if (losesAdmin && users.findAll().stream().filter(x -> x.getRole() == Role.ADMIN && x.isEnabled()).count() <= 1)
            throw new ApiException(HttpStatus.CONFLICT, "At least one active admin is required");

        Supplier supplier = null;
        if (newRole == Role.SUPPLIER) {
            if (r.supplierId() == null)
                throw new ApiException(HttpStatus.BAD_REQUEST, "Choose the supplier this login belongs to", "supplierId");
            supplier = suppliers.findById(r.supplierId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Supplier not found", "supplierId"));
        }
        u.setRole(newRole);
        u.setEnabled(r.active());
        u.setSupplier(supplier);   // cleared automatically for every other role
        return toDto(u);
    }

    private static UserSummary toDto(User u) {
        String role = u.getRole().name().charAt(0) + u.getRole().name().substring(1).toLowerCase();
        return new UserSummary(u.getId(), u.getUsername(), u.getFullName(), u.getEmail(), u.getPhone(), role,
            u.isEnabled(), u.getSupplier() == null ? null : u.getSupplier().getId(),
            u.getSupplier() == null ? null : u.getSupplier().getName(), u.getCreatedAt());
    }
}
