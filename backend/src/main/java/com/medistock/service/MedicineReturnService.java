
package com.medistock.service;

import com.medistock.dto.MedicineReturnDecisionRequest;
import com.medistock.dto.MedicineReturnRequest;
import com.medistock.entity.Inventory;
import com.medistock.entity.MedicineReturn;
import com.medistock.entity.StockLog;
import com.medistock.entity.Supplier;
import com.medistock.entity.User;
import com.medistock.repository.InventoryRepository;
import com.medistock.repository.MedicineReturnRepository;
import com.medistock.repository.StockLogRepository;
import com.medistock.repository.SupplierRepository;
import com.medistock.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class MedicineReturnService {

    private final MedicineReturnRepository returnRepository;
    private final InventoryRepository inventoryRepository;
    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final StockLogRepository stockLogRepository;

    public MedicineReturnService(
            MedicineReturnRepository returnRepository,
            InventoryRepository inventoryRepository,
            SupplierRepository supplierRepository,
            UserRepository userRepository,
            StockLogRepository stockLogRepository) {

        this.returnRepository = returnRepository;
        this.inventoryRepository = inventoryRepository;
        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
        this.stockLogRepository = stockLogRepository;
    }

    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User account not found"));
    }

    private String getRole(User user) {
        return user.getRole()
                .getRoleName()
                .toUpperCase(Locale.ROOT);
    }

    private void validateSupplier(User user) {

        if (!"SUPPLIER".equals(getRole(user))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only suppliers can submit return requests");
        }
    }

    private void validatePharmacist(User user) {

        if (!"PHARMACIST".equals(getRole(user))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only pharmacists can approve or reject returns");
        }
    }

    private Supplier getSupplierForUser(User user) {

        return supplierRepository
                .findByEmailIgnoreCase(user.getEmail())
                .filter(supplier ->
                        Boolean.TRUE.equals(supplier.getActive()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "No active supplier profile is linked to this account"));
    }

    // SUPPLIER: Submit a supplier return request.
    @Transactional
    public MedicineReturn createReturn(MedicineReturnRequest request) {

        User user = getCurrentUser();
        validateSupplier(user);

        if (request.getReturnType() == null
                || !"SUPPLIER_RETURN".equalsIgnoreCase(
                        request.getReturnType().trim())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only supplier returns are supported");
        }

        if (request.getInventoryId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Inventory batch is required");
        }

        if (request.getReturnQuantity() == null
                || request.getReturnQuantity() <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Return quantity must be greater than zero");
        }

        if (request.getReturnReason() == null
                || request.getReturnReason().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Return reason is required");
        }

        if (request.getMedicineCondition() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Medicine condition is required");
        }

        String condition = request.getMedicineCondition()
                .trim()
                .toUpperCase(Locale.ROOT);

        if (!List.of(
                "SEALED",
                "OPENED",
                "DAMAGED",
                "EXPIRED",
                "DEFECTIVE"
        ).contains(condition)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid medicine condition");
        }

        Supplier supplier = getSupplierForUser(user);

        Inventory inventory = inventoryRepository
                .findById(request.getInventoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Inventory batch not found"));

        // A supplier can return only their own inventory.
        if (!supplier.getSupplierId().equals(
                inventory.getSupplierId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can return only inventory belonging to your supplier");
        }

        if (inventory.getQuantity() < request.getReturnQuantity()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Return quantity exceeds available stock");
        }

        MedicineReturn medicineReturn = new MedicineReturn();

        medicineReturn.setReturnType("SUPPLIER_RETURN");
        medicineReturn.setInventoryId(inventory.getInventoryId());
        medicineReturn.setSupplierId(supplier.getSupplierId());

        medicineReturn.setCustomerName(null);
        medicineReturn.setCustomerContact(null);

        medicineReturn.setReturnQuantity(request.getReturnQuantity());
        medicineReturn.setReturnReason(request.getReturnReason().trim());
        medicineReturn.setMedicineCondition(condition);

        medicineReturn.setCreatedBy(user.getUserId());
        medicineReturn.setReturnDate(LocalDate.now());
        medicineReturn.setReturnStatus("PENDING");
        medicineReturn.setRestockEligible(false);
        medicineReturn.setNotes(request.getNotes());

        return returnRepository.save(medicineReturn);
    }

    // PHARMACIST: Approve or reject a supplier return.
    @Transactional
    public MedicineReturn processReturn(
            Long returnId,
            MedicineReturnDecisionRequest request) {

        User user = getCurrentUser();
        validatePharmacist(user);

        MedicineReturn medicineReturn = returnRepository
                .findById(returnId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Return record not found"));

        if (!"SUPPLIER_RETURN".equalsIgnoreCase(
                medicineReturn.getReturnType())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only supplier returns can be processed");
        }

        if (!"PENDING".equalsIgnoreCase(
                medicineReturn.getReturnStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This return has already been processed");
        }

        if (request.getDecision() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Decision is required");
        }

        String decision = request.getDecision()
                .trim()
                .toUpperCase(Locale.ROOT);

        if (!decision.equals("APPROVE")
                && !decision.equals("REJECT")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Decision must be APPROVE or REJECT");
        }

        // Preserve supplier notes and add pharmacist remarks.
        if (request.getNotes() != null
                && !request.getNotes().isBlank()) {

            String existingNotes = medicineReturn.getNotes();

            String updatedNotes =
                    (existingNotes == null || existingNotes.isBlank())
                    ? "Pharmacist: " + request.getNotes().trim()
                    : existingNotes.trim()
                        + " | Pharmacist: "
                        + request.getNotes().trim();

            medicineReturn.setNotes(
                    updatedNotes.length() > 500
                            ? updatedNotes.substring(0, 500)
                            : updatedNotes);
        }

        if (decision.equals("REJECT")) {

            // Rejection must not change inventory.
            medicineReturn.setReturnStatus("REJECTED");
            medicineReturn.setProcessedBy(user.getUserId());
            medicineReturn.setProcessedAt(LocalDateTime.now());

            return returnRepository.save(medicineReturn);
        }

        // Lock inventory to prevent concurrent stock updates.
        Inventory inventory = inventoryRepository
                .findByIdForUpdate(medicineReturn.getInventoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Inventory batch not found"));

        if (!medicineReturn.getSupplierId().equals(
                inventory.getSupplierId())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Return supplier does not match inventory supplier");
        }

        int quantity = medicineReturn.getReturnQuantity();

        if (inventory.getQuantity() < quantity) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Insufficient stock to approve supplier return");
        }

        // Deduct stock only after pharmacist approval.
        inventory.setQuantity(inventory.getQuantity() - quantity);

        inventoryRepository.save(inventory);

        // Record stock movement.
        stockLogRepository.save(new StockLog(
                inventory.getInventoryId(),
                "OUT",
                -quantity,
                user.getUserId(),
                "Supplier return approved. Return ID: " + returnId
        ));

        medicineReturn.setRestockEligible(false);
        medicineReturn.setReturnStatus("APPROVED");
        medicineReturn.setProcessedBy(user.getUserId());
        medicineReturn.setProcessedAt(LocalDateTime.now());

        return returnRepository.save(medicineReturn);
    }

    // SUPPLIER: Own requests only.
    // PHARMACIST: All supplier return requests.
    @Transactional(readOnly = true)
    public List<MedicineReturn> getAllReturns() {

        User user = getCurrentUser();
        String role = getRole(user);

        if ("PHARMACIST".equals(role)) {

            return returnRepository
                    .findByReturnTypeOrderByCreatedAtDesc(
                            "SUPPLIER_RETURN");
        }

        if ("SUPPLIER".equals(role)) {

            Supplier supplier = getSupplierForUser(user);

            return returnRepository
                    .findBySupplierIdOrderByCreatedAtDesc(
                            supplier.getSupplierId());
        }

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You are not allowed to view return records");
    }
}
