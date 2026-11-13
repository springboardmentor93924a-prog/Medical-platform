package com.medistock.backend.controller;

import com.medistock.backend.dto.RecommendationDtos.RecommendationResponse;
import com.medistock.backend.service.RecommendationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
@PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
public class RecommendationController {
    private final RecommendationService service;

    public RecommendationController(RecommendationService service) { this.service = service; }

    @GetMapping
    public RecommendationResponse recommendations() { return service.build(); }
}
