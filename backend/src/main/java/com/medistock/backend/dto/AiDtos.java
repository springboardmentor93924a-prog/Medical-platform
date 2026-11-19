package com.medistock.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class AiDtos {
    private AiDtos() {}

    /** history is optional: the last few messages of this chat (role is "user" or "model"), so the AI remembers the conversation. */
    public record AiRequest(@Size(max = 300, message = "Keep the question under 300 characters") String question,
                            @Size(max = 6, message = "Too much chat history") @Valid List<Turn> history) {}

    public record Turn(@Size(max = 10) String role, @Size(max = 2000, message = "A chat message is too long") String text) {}

    /** answer is the model's reply: a JSON list of recommendations, which the page turns into cards. */
    public record AiResponse(String answer, String model) {}
}