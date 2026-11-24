package com.medistock.medistock.repository;

import com.medistock.medistock.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    List<User> findAllByOrderByUserIdAsc();

    List<User> findByRoleId(Integer roleId);

    List<User> findByRoleIdAndActiveTrue(Integer roleId);
}
