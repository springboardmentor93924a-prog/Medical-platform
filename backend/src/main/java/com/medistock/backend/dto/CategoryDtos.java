package com.medistock.backend.dto;

import jakarta.validation.constraints.*;

public final class CategoryDtos {
    private CategoryDtos() {}

    public record CategoryRequest(
        @NotBlank(message = "Category name is required")
        @Size(min = 2, max = 50, message = "Name must be 2-50 characters")
        String name,
        @Size(max = 255, message = "Description is too long")
        String description) {}

    /** medicineCount = medicines in this category that have not been deleted */
    public record CategoryResponse(Long id, String name, String description, long medicineCount) {}
}
