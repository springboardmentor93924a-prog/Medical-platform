package com.medistock.medistock.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record NotificationDto(
        Integer notificationId,
        String notificationType,
        String message,
        LocalDateTime createdAt,
        Boolean isRead,
        Integer medicineId,
        String medicineName,
        String batchNumber,
        String supplierName,
        Integer quantity,
        LocalDate expiryDate) {
}
