
package com.medistock.controller;

import com.medistock.dto.ChatRequest;
import com.medistock.service.AssistantService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Built-in inventory assistant.
 * Answers using local database information with role-based access.
 */
@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping("/chat")
    public Map<String, Object> chat(
            @RequestBody ChatRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();

        return assistantService.answer(
                request == null ? null : request.message(),
                email
        );
    }

    @GetMapping("/suggestions")
    public List<String> suggestions(Authentication authentication) {
        String email = authentication.getName();

        return assistantService.getSuggestions(email);
    }
}
