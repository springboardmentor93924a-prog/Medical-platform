package com.medistock.medistock_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BackupMetadata {
    private String fileName;
    private Long sizeBytes;
    private LocalDateTime createdAt;
    private String status; // OK, CORRUPTED, EMPTY
    private int tableCount;
}