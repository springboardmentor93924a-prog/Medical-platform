package com.medistock.controller;

import com.medistock.dto.ChatRequest;
import com.medistock.service.AssistantService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Built-in inventory assistant. Answers from the local database only.
 */
@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping("/chat")
    public Map<String, Object> chat(@RequestBody ChatRequest request) {
        return assistantService.answer(
                request == null ? null : request.message()
        );
    }

    @GetMapping("/suggestions")
    public List<String> suggestions() {
        return List.of(
                "Which items are low on stock?",
                "What expires in the next 90 days?",
                "Show expired batches",
                "What is our total wastage?",
                "Which batch should I dispense first?",
                "Show pending returns"
        );
    }
}
