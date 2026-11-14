package com.medistock.service.impl;

import com.medistock.dto.request.StockMovementRequest;
import com.medistock.entity.Medicine;
import com.medistock.entity.StockMovement;
import com.medistock.entity.User;
import com.medistock.enums.MedicineStatus;
import com.medistock.enums.MovementType;
import com.medistock.enums.NotificationType;
import com.medistock.enums.Role;
import com.medistock.exception.BadRequestException;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.StockMovementRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.AuditLogService;
import com.medistock.service.NotificationService;
import com.medistock.service.StockMovementService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class StockMovementServiceImpl implements StockMovementService {

    private final StockMovementRepository stockMovementRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public StockMovementServiceImpl(StockMovementRepository stockMovementRepository,
                                    MedicineRepository medicineRepository,
                                    UserRepository userRepository,
                                    NotificationService notificationService,
                                    AuditLogService auditLogService) {
        this.stockMovementRepository = stockMovementRepository;
        this.medicineRepository = medicineRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public StockMovement recordMovement(StockMovementRequest request, String userEmail) {
        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + request.getMedicineId()));

        if (medicine.getStatus() == MedicineStatus.ARCHIVED) {
            throw new BadRequestException("Cannot record stock movements for archived medicines.");
        }

        User user = userRepository.findByEmail(userEmail).orElse(null);
        int currentQty = medicine.getQuantity();
        int movementQty = request.getQuantity();

        if (request.getMovementType() == MovementType.STOCK_OUT) {
            // Prevent issuing expired medicine
            if (medicine.getExpiryDate().isBefore(LocalDate.now())) {
                throw new BadRequestException("Medicine batch '" + medicine.getBatchNumber() + "' has expired (" +
                        medicine.getExpiryDate() + "). It cannot be dispensed. Please record as DISPOSAL instead.");
            }
            if (currentQty < movementQty) {
                throw new BadRequestException("Insufficient stock available for medicine '" + medicine.getName() +
                        "'. Requested: " + movementQty + ", Available: " + currentQty);
            }
            medicine.setQuantity(currentQty - movementQty);
        } else if (request.getMovementType() == MovementType.DISPOSAL) {
            if (currentQty < movementQty) {
                throw new BadRequestException("Disposal quantity (" + movementQty + ") exceeds available stock (" + currentQty + ").");
            }
            medicine.setQuantity(currentQty - movementQty);
        } else if (request.getMovementType() == MovementType.RETURN) {
            if (currentQty < movementQty) {
                throw new BadRequestException("Return quantity (" + movementQty + ") exceeds available stock (" + currentQty + ").");
            }
            medicine.setQuantity(currentQty - movementQty);
        } else if (request.getMovementType() == MovementType.STOCK_IN) {
            medicine.setQuantity(currentQty + movementQty);
        } else if (request.getMovementType() == MovementType.ADJUSTMENT) {
            // In adjustment, movementQty is the new adjusted quantity or delta
            medicine.setQuantity(movementQty);
        }

        medicineRepository.save(medicine);

        StockMovement movement = new StockMovement(
                medicine,
                request.getMovementType(),
                request.getQuantity(),
                request.getReason(),
                request.getReferenceNumber() != null ? request.getReferenceNumber() : "REF-" + System.currentTimeMillis(),
                user
        );
        StockMovement savedMovement = stockMovementRepository.save(movement);

        // Check if now low stock
        if (medicine.getQuantity() <= medicine.getMinimumStockLevel()) {
            NotificationType nType = medicine.getQuantity() == 0 ? NotificationType.OUT_OF_STOCK : NotificationType.LOW_STOCK;
            notificationService.sendNotification(
                    null,
                    Role.PHARMACIST,
                    "Stock Alert: " + medicine.getName(),
                    "Stock level for " + medicine.getName() + " is now " + medicine.getQuantity() + " units (Minimum threshold: " + medicine.getMinimumStockLevel() + ").",
                    nType
            );
        }

        auditLogService.log(userEmail, user != null ? user.getRole().name() : "USER", "STOCK_MOVEMENT", "Medicine", medicine.getId().toString(),
                "Recorded movement " + request.getMovementType() + " of " + request.getQuantity() + " units for " + medicine.getName());

        return savedMovement;
    }

    @Override
    public Page<StockMovement> getMovements(Long medicineId, MovementType movementType, Pageable pageable) {
        if (medicineId != null && movementType != null) {
            return stockMovementRepository.findByMedicineIdAndMovementType(medicineId, movementType, pageable);
        } else if (medicineId != null) {
            return stockMovementRepository.findByMedicineId(medicineId, pageable);
        } else if (movementType != null) {
            return stockMovementRepository.findByMovementType(movementType, pageable);
        } else {
            return stockMovementRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
    }

    @Override
    public List<StockMovement> getMovementsForMedicine(Long medicineId) {
        return stockMovementRepository.findByMedicineIdOrderByCreatedAtDesc(medicineId);
    }
}
