package com.medistock.repository;

import com.medistock.entity.User;
import com.medistock.enums.Role;
import com.medistock.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole(Role role);
    long countByStatus(UserStatus status);
    List<User> findAllByRole(Role role);
    List<User> findAllByStatus(UserStatus status);
    List<User> findAllByRoleAndStatus(Role role, UserStatus status);
}
