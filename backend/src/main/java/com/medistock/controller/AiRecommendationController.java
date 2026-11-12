
package com.medistock.controller;

import com.medistock.dto.AiRecommendationResponse;
import com.medistock.service.AiRecommendationService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai-recommendations")
public class AiRecommendationController {

    private final AiRecommendationService aiRecommendationService;

    public AiRecommendationController(
            AiRecommendationService aiRecommendationService
    ) {
        this.aiRecommendationService = aiRecommendationService;
    }

    // Get all five AI recommendation features
    @GetMapping
    public ResponseEntity<AiRecommendationResponse> getRecommendations() {

        AiRecommendationResponse response =
                aiRecommendationService.getRecommendations();

        return ResponseEntity.ok(response);
    }
}
