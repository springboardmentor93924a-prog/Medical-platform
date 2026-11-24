package com.medistock.medistock.ai.controller;

import com.medistock.medistock.ai.chat.ChatOrchestratorService;
import com.medistock.medistock.ai.dto.ChatReplyDto;
import com.medistock.medistock.ai.entity.AIChatMessage;
import com.medistock.medistock.ai.entity.AIChatSession;
import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.service.CurrentUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/ai/chat")
@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER')")
public class ChatController {

    private final ChatOrchestratorService chatService;
    private final CurrentUserService currentUserService;

    public ChatController(ChatOrchestratorService chatService, CurrentUserService currentUserService) {
        this.chatService = chatService;
        this.currentUserService = currentUserService;
    }

    public record ChatRequest(Integer sessionId, String message) {}

    @PostMapping("/message")
    public ResponseEntity<ApiResponse<ChatReplyDto>> sendMessage(@RequestBody ChatRequest request) {
        Integer userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("User not authenticated"));
        }

        try {
            ChatReplyDto reply = chatService.handleUserMessage(request.sessionId(), request.message(), userId);
            return ResponseEntity.ok(ApiResponse.ok(reply));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Chat engine failed: " + e.getMessage()));
        }
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<AIChatSession>>> getSessions() {
        Integer userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("User not authenticated"));
        }
        return ResponseEntity.ok(ApiResponse.ok(chatService.getUserSessions(userId)));
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<ApiResponse<List<AIChatMessage>>> getSessionMessages(@PathVariable Integer sessionId) {
        Integer userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("User not authenticated"));
        }

        try {
            List<AIChatMessage> messages = chatService.getSessionMessages(sessionId, userId);
            return ResponseEntity.ok(ApiResponse.ok(messages));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteSession(@PathVariable Integer sessionId) {
        Integer userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("User not authenticated"));
        }

        try {
            chatService.deleteSession(sessionId, userId);
            return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Session deleted successfully")));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<String>>> getSuggestions() {
        String role = currentUserService.getCurrentUserRole();
        List<String> suggestions;
        switch (role) {
            case "STAFF" -> suggestions = List.of(
                    "What is the available stock of Paracetamol?",
                    "Check usable stock levels for Amoxicillin",
                    "Is Insulin available in the pharmacy inventory?"
            );
            case "SUPPLIER" -> suggestions = List.of(
                    "List my active purchase orders",
                    "Show my supplier company summary",
                    "What orders are currently pending delivery?"
            );
            default -> suggestions = List.of(
                    "Which medicine batches expire in the next 30 days?",
                    "Show all medicines with critical low stock shortages",
                    "Forecast demand and consumption velocity for Paracetamol",
                    "What is our total expired stock financial loss?",
                    "List all wholesale suppliers and active purchase orders"
            );
        }
        return ResponseEntity.ok(ApiResponse.ok(suggestions));
    }
}

