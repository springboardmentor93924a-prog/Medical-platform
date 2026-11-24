package com.medistock.medistock.service;

import com.medistock.medistock.entity.Supplier;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.SupplierRepository;
import com.medistock.medistock.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;

    public CurrentUserService(UserRepository userRepository, SupplierRepository supplierRepository) {
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
    }

    public Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    public Optional<User> getCurrentUser() {
        Authentication auth = getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return Optional.empty();
        }
        return userRepository.findByEmail(auth.getName());
    }

    public Integer getCurrentUserId() {
        return getCurrentUser().map(User::getUserId).orElse(null);
    }

    public boolean hasRole(String roleName) {
        Authentication auth = getAuthentication();
        if (auth == null) return false;
        String expected = "ROLE_" + roleName.toUpperCase();
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equalsIgnoreCase(expected));
    }

    /**
     * Resolves the canonical role of the authenticated user in uppercase.
     * E.g. "ADMIN", "PHARMACIST", "STAFF", "SUPPLIER", or "ANONYMOUS".
     */
    public String getCurrentUserRole() {
        Authentication auth = getAuthentication();
        if (auth != null && auth.getAuthorities() != null) {
            for (var authority : auth.getAuthorities()) {
                String authStr = authority.getAuthority();
                if (authStr.startsWith("ROLE_")) {
                    return authStr.substring(5).toUpperCase();
                }
            }
        }
        return getCurrentUser()
                .map(u -> {
                    if (u.getRole() != null && u.getRole().getRoleName() != null) {
                        return u.getRole().getRoleName().trim().toUpperCase();
                    }
                    return "STAFF";
                })
                .orElse("ANONYMOUS");
    }

    public Optional<Supplier> getSupplierForCurrentUser() {
        return getCurrentUser().flatMap(u -> supplierRepository.findByEmail(u.getEmail()));
    }
}
