package com.medistock.medistock;

import com.medistock.medistock.dto.LoginRequest;
import com.medistock.medistock.dto.LoginResponse;
import com.medistock.medistock.entity.Role;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.MedicineRepository;
import com.medistock.medistock.repository.RoleRepository;
import com.medistock.medistock.repository.SupplierRepository;
import com.medistock.medistock.repository.UserRepository;
import com.medistock.medistock.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class Milestone1Tests {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("Task 2: Verify Database Connectivity to MariaDB")
    void testDatabaseConnectivity() throws SQLException {
        assertNotNull(dataSource, "DataSource bean should be configured");
        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "Should obtain a valid database connection");
            assertFalse(connection.isClosed(), "Connection should be open");
            String dbProduct = connection.getMetaData().getDatabaseProductName();
            assertTrue(dbProduct.toLowerCase().contains("maria") || dbProduct.toLowerCase().contains("mysql"),
                    "Connected database should be MariaDB or MySQL, got: " + dbProduct);
        }
    }

    @Test
    @DisplayName("Task 5: Verify Role Foundation - Admin, Pharmacist, Staff, Supplier")
    void testRolesExistInDatabase() {
        List<Role> roles = roleRepository.findAll();
        assertFalse(roles.isEmpty(), "Roles table should contain seeded roles");

        List<String> roleNames = roles.stream()
                .map(r -> r.getRoleName().trim().toUpperCase())
                .toList();

        assertTrue(roleNames.contains("ADMIN"), "Role ADMIN must exist");
        assertTrue(roleNames.contains("PHARMACIST"), "Role PHARMACIST must exist");
        assertTrue(roleNames.contains("STAFF"), "Role STAFF must exist");
        assertTrue(roleNames.contains("SUPPLIER"), "Role SUPPLIER must exist");
    }

    @Test
    @DisplayName("Task 2 & 3: Verify Repositories and Entity Mappings")
    void testEntityMappingsAndRepositories() {
        long userCount = userRepository.count();
        assertTrue(userCount >= 4, "Users table should contain users for all roles");

        long medicineCount = medicineRepository.count();
        assertTrue(medicineCount >= 0, "Medicines repository query should execute without error");

        long supplierCount = supplierRepository.count();
        assertTrue(supplierCount >= 1, "Suppliers repository query should execute without error");
    }

    @Test
    @DisplayName("Task 4: Password Format and BCrypt Verification")
    void testPasswordFormatIsBCrypt() {
        Optional<User> adminOpt = userRepository.findByEmail("admin@medistock.com");
        assertTrue(adminOpt.isPresent(), "admin@medistock.com must exist");

        User admin = adminOpt.get();
        assertNotNull(admin.getPasswordHash(), "Password hash must not be null");
        assertTrue(admin.getPasswordHash().startsWith("$2a$") || admin.getPasswordHash().startsWith("$2b$"),
                "Stored password must be a standard BCrypt hash starting with $2a$ or $2b$");
        assertEquals(60, admin.getPasswordHash().length(), "Standard BCrypt hash must have length 60");
    }

    @Test
    @DisplayName("Task 4: Successful Authentication for Admin")
    void testSuccessfulLoginAdmin() {
        LoginRequest req = new LoginRequest("admin@medistock.com", "password123");
        LoginResponse res = authService.login(req);

        assertNotNull(res, "Login response should not be null");
        assertNotNull(res.getToken(), "JWT token must be generated");
        assertEquals("ADMIN", res.getRole(), "User role must resolve to ADMIN from database");
        assertEquals("admin@medistock.com", res.getEmail());
    }

    @Test
    @DisplayName("Task 4: Successful Authentication for Pharmacist, Staff, Supplier")
    void testSuccessfulLoginOtherRoles() {
        // Pharmacist
        LoginResponse pharmRes = authService.login(new LoginRequest("pharmacist@medistock.com", "password123"));
        assertEquals("PHARMACIST", pharmRes.getRole());
        assertNotNull(pharmRes.getToken());

        // Staff
        LoginResponse staffRes = authService.login(new LoginRequest("staff@medistock.com", "password123"));
        assertEquals("STAFF", staffRes.getRole());
        assertNotNull(staffRes.getToken());

        // Supplier
        LoginResponse supRes = authService.login(new LoginRequest("supplier@medistock.com", "password123"));
        assertEquals("SUPPLIER", supRes.getRole());
        assertNotNull(supRes.getToken());
    }

    @Test
    @DisplayName("Task 4: Reject Invalid Credentials with BadCredentialsException")
    void testInvalidCredentialsRejection() {
        LoginRequest req = new LoginRequest("admin@medistock.com", "WrongPasswordXYZ");
        assertThrows(BadCredentialsException.class, () -> authService.login(req),
                "Invalid password must throw BadCredentialsException");

        LoginRequest unknownUser = new LoginRequest("nonexistent@medistock.com", "password123");
        assertThrows(BadCredentialsException.class, () -> authService.login(unknownUser),
                "Unknown email must throw BadCredentialsException");
    }

    @Test
    @DisplayName("Task 4: Reject Inactive User with DisabledException")
    void testInactiveUserRejection() {
        LoginRequest req = new LoginRequest("inactive@medistock.com", "password123");
        DisabledException ex = assertThrows(DisabledException.class, () -> authService.login(req),
                "Inactive account must throw DisabledException");
        assertTrue(ex.getMessage().toLowerCase().contains("inactive"),
                "Exception message must state account is inactive");
    }

    @Test
    @DisplayName("Task 6: Sign Up - Register New User with Role to Database")
    void testRegisterNewUserWithRole() {
        String testEmail = "testuser_" + System.currentTimeMillis() + "@medistock.com";
        com.medistock.medistock.dto.RegisterRequest regReq = new com.medistock.medistock.dto.RegisterRequest();
        regReq.setFullName("Dr. Robert Harrison");
        regReq.setEmail(testEmail);
        regReq.setPassword("securePass123");
        regReq.setRoleId(2); // Pharmacist
        regReq.setPhone("+1 555-9876");

        LoginResponse res = authService.register(regReq);
        assertNotNull(res, "Register response must not be null");
        assertNotNull(res.getToken(), "JWT token must be issued on successful registration");
        assertEquals("PHARMACIST", res.getRole(), "User role must match assigned Pharmacist role");
        assertEquals(testEmail, res.getEmail());

        // Verify stored in DB
        Optional<User> savedOpt = userRepository.findByEmail(testEmail);
        assertTrue(savedOpt.isPresent(), "Registered user must be saved in the database");
        User saved = savedOpt.get();
        assertEquals("Dr. Robert Harrison", saved.getFullName());
        assertEquals(2, saved.getRoleId());
        assertTrue(passwordEncoder.matches("securePass123", saved.getPasswordHash()), "Password must be BCrypt hashed");

        // Verify duplicate email is rejected
        assertThrows(IllegalArgumentException.class, () -> authService.register(regReq),
                "Registering with duplicate email must throw IllegalArgumentException");
    }

    @Test
    @DisplayName("Task 6: Sign Up - Retrieve Available System Roles")
    void testGetAllRoles() {
        List<Role> roles = authService.getAllRoles();
        assertNotNull(roles);
        assertTrue(roles.size() >= 4, "Should return at least the 4 standard roles");
    }
}
