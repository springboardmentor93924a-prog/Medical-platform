package com.medistock.backend.controller;

import com.medistock.backend.dto.StockCountDtos.*;
import com.medistock.backend.service.StockCountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/stock-counts")
public class StockCountController {
    private final StockCountService service;

    public StockCountController(StockCountService service) { this.service = service; }

    // Staff make the counts
    @PostMapping
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<CountResponse> record(@Valid @RequestBody CountRequest r, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.record(r, auth.getName()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','STAFF')")
    public List<CountResponse> list(Authentication auth) {
        boolean all = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_PHARMACIST"));
        return service.list(auth.getName(), all);
    }

    // The Pharmacist or Admin marks a difference as looked at
    @PostMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public CountResponse review(@PathVariable Long id, Authentication auth) { return service.review(id, auth.getName()); }
}
