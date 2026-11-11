package com.medistock.medistock.repository;

import com.medistock.medistock.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndUserIdNot(String email, Integer userId);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCaseAndUserIdNot(String username, Integer userId);

    @Query("SELECT COUNT(u) FROM User u WHERE LOWER(u.role.roleName) = LOWER(:roleName) AND u.active = true")
    long countActiveUsersByRoleName(@Param("roleName") String roleName);

    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.userId != :currentUserId ORDER BY u.role.roleId ASC, u.name ASC")
    List<User> findContactsForUser(@Param("currentUserId") Integer currentUserId);

    @Query("SELECT u FROM User u JOIN FETCH u.role ORDER BY u.role.roleId ASC, u.name ASC")
    List<User> findAllWithRoles();
}