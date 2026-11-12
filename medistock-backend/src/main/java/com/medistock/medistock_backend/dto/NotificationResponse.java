package com.medistock.medistock_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NotificationResponse {
    private String id;
    private String type; // "WARNING", "CRITICAL", "INFO"
    private String title;
    private String message;
    private String time;
}