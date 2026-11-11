
package com.medistock.medistock.repository;

import com.medistock.medistock.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByRoleNameIgnoreCase(String roleName);
}
