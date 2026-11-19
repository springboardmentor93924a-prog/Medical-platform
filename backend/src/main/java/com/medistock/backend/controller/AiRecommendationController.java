package com.medistock.backend.controller;

import com.medistock.backend.dto.AiDtos.*;
import com.medistock.backend.service.AiRecommendationService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recommendations/ai")
@PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
public class AiRecommendationController {
    private final AiRecommendationService service;

    public AiRecommendationController(AiRecommendationService service) { this.service = service; }

    @PostMapping
    public AiResponse ask(@Valid @RequestBody(required = false) AiRequest r, Authentication auth) {
        return service.advise(r == null ? null : r.question(), r == null ? null : r.history(), auth.getName());
    }
}