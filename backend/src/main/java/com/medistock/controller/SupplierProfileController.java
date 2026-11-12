
package com.medistock.controller;

import com.medistock.entity.Supplier;

import com.medistock.dto.InventoryMedicineDTO;

import com.medistock.repository.SupplierRepository;
import com.medistock.repository.InventoryRepository;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import org.springframework.http.ResponseEntity;
import java.util.UUID;

@RestController
@RequestMapping("/api/supplier")
public class SupplierProfileController {

    private final SupplierRepository supplierRepository;
    private final InventoryRepository inventoryRepository;

    @Value("${medistock.upload-dir:uploads}")
    private String uploadDirectory;

    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    public SupplierProfileController(
        SupplierRepository supplierRepository,
        InventoryRepository inventoryRepository) {

    this.supplierRepository = supplierRepository;
    this.inventoryRepository = inventoryRepository;

    System.out.println(">>> SupplierProfileController initialized!");
}

    // ==========================================
    // GET LOGGED-IN SUPPLIER PROFILE
    // ==========================================

   @GetMapping("/me")
    public Supplier getMyProfile(Authentication authentication) {

        Supplier supplier = getSupplier(authentication);

        System.out.println("Profile Supplier ID: " + supplier.getSupplierId());
        System.out.println("Profile Email: " + supplier.getEmail());
        System.out.println("Profile Active: " + supplier.getActive());

        return supplier;
    }

    // ==========================================
    // UPDATE SUPPLIER PROFILE
    // ==========================================

    @PutMapping("/me")
    public Supplier updateMyProfile(
            Authentication authentication,
            @RequestBody SupplierProfileRequest request) {

        Supplier supplier = getSupplier(authentication);

        if (request.getSupplierName() == null
                || request.getSupplierName().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Supplier name is required"
            );
        }

        if (request.getSupplierName().trim().length() > 150) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Supplier name is too long"
            );
        }

        supplier.setSupplierName(
                request.getSupplierName().trim()
        );

        supplier.setContactNumber(
                request.getContactNumber()
        );

        supplier.setAddress(
                request.getAddress()
        );

        return supplierRepository.save(supplier);
    }


    // Get inventory batches belonging only to the logged-in supplier
    @GetMapping("/me/inventory")
    public ResponseEntity<List<InventoryMedicineDTO>> getMyInventory(
            Authentication authentication) {

        Supplier supplier = getSupplier(authentication);

        List<InventoryMedicineDTO> inventory =
                inventoryRepository.findInventoryWithMedicineDetailsBySupplierId(
                        supplier.getSupplierId()
                );

        return ResponseEntity.ok(inventory);
    }

 

    // ==========================================
    // UPLOAD SUPPLIER PROFILE PICTURE
    // ==========================================

    @PostMapping(
            value = "/me/profile-picture",
            consumes = "multipart/form-data"
    )
    public Supplier uploadProfilePicture(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {

        Supplier supplier = getSupplier(authentication);

        // Check empty file
        if (file == null || file.isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select an image"
            );
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Image size must not exceed 2 MB"
            );
        }

       

        // Check image type
        String contentType = file.getContentType();

        if (contentType == null
                || !ALLOWED_TYPES.contains(contentType)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only JPG, PNG and WEBP images are allowed"
            );
        }

        // Determine extension
        String extension;

        switch (contentType) {

            case "image/jpeg":
                extension = ".jpg";
                break;

            case "image/png":
                extension = ".png";
                break;

            case "image/webp":
                extension = ".webp";
                break;

            default:
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Unsupported image type"
                );
        }

        // Generate unique file name
        String fileName = UUID.randomUUID() + extension;

        // Create upload directory
        Path uploadPath = Paths.get(
                uploadDirectory,
                "suppliers"
        ).toAbsolutePath().normalize();

        try {

            Files.createDirectories(uploadPath);

            Path targetPath = uploadPath
                    .resolve(fileName)
                    .normalize();

            if (!targetPath.startsWith(uploadPath)) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid file path"
                );
            }

            // Save image
            Files.copy(
                    file.getInputStream(),
                    targetPath,
                    StandardCopyOption.REPLACE_EXISTING
            );

            // Keep previous image URL
            String oldImageUrl = supplier.getProfileImageUrl();

            // Save new image URL
            supplier.setProfileImageUrl(
                    "/uploads/suppliers/" + fileName
            );

            // Update database
            Supplier savedSupplier =
                    supplierRepository.save(supplier);

            // Delete old image after database save
            deleteOldImage(oldImageUrl);

            return savedSupplier;

        } catch (IOException e) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not upload profile picture"
            );
        }
    }

    // ==========================================
    // GET CURRENT SUPPLIER USING JWT EMAIL
    // ==========================================

    private Supplier getSupplier(
            Authentication authentication) {

        if (authentication == null) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        String email = authentication.getName();

        return supplierRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Supplier profile not found"
                ));
    }

    // ==========================================
    // DELETE PREVIOUS PROFILE PICTURE
    // ==========================================

    private void deleteOldImage(String imageUrl) {

        if (imageUrl == null
                || !imageUrl.startsWith("/uploads/suppliers/")) {

            return;
        }

        try {

            String fileName = imageUrl.substring(
                    "/uploads/suppliers/".length()
            );

            // Prevent path traversal
            if (fileName.contains("/")
                    || fileName.contains("\\")) {

                return;
            }

            Path uploadPath = Paths.get(
                    uploadDirectory,
                    "suppliers"
            ).toAbsolutePath().normalize();

            Path oldPath = uploadPath
                    .resolve(fileName)
                    .normalize();

            if (oldPath.startsWith(uploadPath)) {

                Files.deleteIfExists(oldPath);
            }

        } catch (IOException e) {

            System.err.println(
                    "Could not delete previous supplier image: "
                            + e.getMessage()
            );
        }
    }

    // ==========================================
    // PROFILE UPDATE REQUEST
    // ==========================================

    public static class SupplierProfileRequest {

        private String supplierName;
        private String contactNumber;
        private String address;

        public String getSupplierName() {
            return supplierName;
        }

        public void setSupplierName(String supplierName) {
            this.supplierName = supplierName;
        }

        public String getContactNumber() {
            return contactNumber;
        }

        public void setContactNumber(String contactNumber) {
            this.contactNumber = contactNumber;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }
    }



    // GET MEDICINES SUPPLIED BY LOGGED-IN SUPPLIER
@GetMapping("/me/medicines")
public List<String> getMyMedicines(Authentication authentication) {

    Supplier supplier = getSupplier(authentication);

    System.out.println("Logged-in Supplier ID: " + supplier.getSupplierId());

    List<String> medicines =
            inventoryRepository.findMedicineNamesBySupplierId(
                    supplier.getSupplierId()
            );

    System.out.println("Medicines found: " + medicines);

    return medicines;
}
}
