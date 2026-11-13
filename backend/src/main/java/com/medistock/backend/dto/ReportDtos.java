package com.medistock.backend.dto;

import java.util.List;

public final class ReportDtos {
    private ReportDtos() {}

    /** A report as plain text cells, so the same data can be shown on screen and exported later. */
    public record ReportResponse(String type, String title, String generatedAt,
                                 List<String> columns, List<List<String>> rows) {}
}
