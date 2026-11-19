package com.medistock.backend.service;

import com.medistock.backend.dto.AiDtos.AiResponse;
import com.medistock.backend.dto.AiDtos.Turn;
import com.medistock.backend.dto.InventoryDtos.InventoryRow;
import com.medistock.backend.dto.RecommendationDtos.RecommendationResponse;
import com.medistock.backend.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import java.time.Duration;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Asks an AI model (Google Gemini) for stock advice. The model gets the current stock, our own rule-based
 * suggestions and today's date, and also uses general knowledge such as seasonal demand.
 * Only medicine names and quantities are sent. No user names, phone numbers or emails leave the server.
 */
@Service
public class AiRecommendationService {
    private static final Logger log = LoggerFactory.getLogger(AiRecommendationService.class);
    private static final String SYSTEM = "You are an inventory advisor for a pharmacy in India. Give practical advice about stock, ordering, "
            + "expiry and cost. Use the data you are given AND general knowledge, such as seasonal demand (monsoon fevers, winter colds, summer "
            + "dehydration), common substitutes, and storage. Never give medical, dosage or diagnosis advice. "
            + "Reply with ONLY a JSON array of 5 to 8 objects with these keys: title (short), priority (High, Medium or Low), "
            + "category (Reorder, Seasonal, Expiry, Cost or Safety), advice (1 to 3 sentences), medicines (an array of medicine names from the data, may be empty). "
            + "Write nothing outside the JSON.";
    /** Used when the pharmacist types a question: answer exactly what was asked, in plain text. */
    private static final String SYSTEM_CHAT = "You are a helpful assistant for a pharmacy owner in India. Answer the question that is asked, directly and completely. "
            + "The pharmacy's current stock is given only as background: use it when the question is about the stock, and ignore it when it is not. "
            + "If the question asks for NEW medicines or products to start selling, suggest items that are NOT in the current stock list and never repeat existing ones. "
            + "You may use general knowledge: seasonal demand, popular products, substitutes, pricing, storage, shop management and ordering. "
            + "Never give personal medical, dosage or diagnosis advice. "
            + "Reply in plain text only: short paragraphs or numbered lines, with no markdown symbols such as ** or #, and no JSON.";

    private final RecommendationService rules;
    private final InventoryService inventory;
    private final RestClient http;
    private final String key, model;
    private final int maxTokens;
    private final Map<String, Long> lastCall = new ConcurrentHashMap<>();

    public AiRecommendationService(RecommendationService rules, InventoryService inventory,
                                   @Value("${app.ai.gemini.key:}") String key,
                                   @Value("${app.ai.gemini.model:gemini-3.8-flash}") String model,
                                   @Value("${app.ai.max-tokens:4096}") int maxTokens) {
        this.rules = rules; this.inventory = inventory; this.key = key; this.model = model; this.maxTokens = maxTokens;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(60));
        this.http = RestClient.builder().baseUrl("https://generativelanguage.googleapis.com").requestFactory(factory).build();
    }

    @SuppressWarnings("unchecked")
    public AiResponse advise(String question, List<Turn> history, String username) {
        if (key.isBlank())
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI advice is not set up. Add app.ai.gemini.key to application-local.properties.");
        long now = System.currentTimeMillis();
        Long previous = lastCall.put(username, now);
        if (previous != null && now - previous < 10_000)
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Please wait a few seconds before asking again.");

        boolean asked = question != null && !question.isBlank();
        Map<String, Object> generation = new HashMap<>();
        generation.put("maxOutputTokens", maxTokens);
        if (!asked) generation.put("responseMimeType", "application/json"); // no question: the usual JSON advice cards
        // Earlier messages of this chat (only when a question is typed), then the new message with the current stock.
        List<Map<String, Object>> contents = new ArrayList<>();
        if (asked && history != null)
            for (Turn t : history) {
                if (t == null || t.text() == null || t.text().isBlank()) continue;
                String role = "model".equals(t.role()) ? "model" : "user";
                if (contents.isEmpty() ? role.equals("model") : contents.get(contents.size() - 1).get("role").equals(role)) continue; // must start with user and alternate
                String text = t.text().replaceAll("[\\p{Cntrl}&&[^\n]]", " ").trim();
                contents.add(Map.of("role", role, "parts", List.of(Map.of("text", text.length() > 1500 ? text.substring(0, 1500) : text))));
            }
        if (!contents.isEmpty() && contents.get(contents.size() - 1).get("role").equals("user")) contents.remove(contents.size() - 1);
        contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", prompt(question)))));
        Map<String, Object> payload = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", asked ? SYSTEM_CHAT : SYSTEM))),
                "contents", contents,
                "generationConfig", generation);
        try {
            Map<String, Object> reply = http.post().uri("/v1beta/models/{model}:generateContent", model)
                    .header("x-goog-api-key", key)
                    .contentType(MediaType.APPLICATION_JSON).body(payload).retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
            StringBuilder text = new StringBuilder();
            String finishReason = "";
            if (reply != null && reply.get("candidates") instanceof List<?> candidates && !candidates.isEmpty()
                    && candidates.get(0) instanceof Map<?, ?> candidate) {
                if (candidate.get("finishReason") != null) finishReason = String.valueOf(candidate.get("finishReason"));
                if (candidate.get("content") instanceof Map<?, ?> content && content.get("parts") instanceof List<?> parts)
                    for (Object part : parts)
                        if (part instanceof Map<?, ?> pm && pm.get("text") != null) text.append(pm.get("text"));
            }
            if (text.isEmpty()) throw new ApiException(HttpStatus.BAD_GATEWAY, "The AI service sent an empty answer. Please try again.");
            if ("MAX_TOKENS".equals(finishReason))
                throw new ApiException(HttpStatus.BAD_GATEWAY, "The AI answer was cut off. Please try again.");
            return new AiResponse(text.toString(), model);
        } catch (RestClientResponseException e) {
            log.error("AI service returned HTTP {}: {}", e.getStatusCode().value(), e.getResponseBodyAsString());
            int code = e.getStatusCode().value();
            throw new ApiException(HttpStatus.BAD_GATEWAY, code == 401 || code == 403 ? "The AI key was rejected. Check app.ai.gemini.key."
                    : code == 429 ? "The free AI limit was reached. Please try again in a minute."
                    : code == 404 ? "The AI model was not found. Check app.ai.gemini.model."
                    : code == 400 ? "The AI service refused the request. Check app.ai.gemini.key and the model name." : "The AI service had a problem (HTTP " + code + ").");
        } catch (RestClientException e) {
            log.error("Could not reach the AI service", e);
            boolean slow = e.getCause() instanceof java.net.SocketTimeoutException;
            throw new ApiException(HttpStatus.BAD_GATEWAY, slow ? "The AI took too long to answer. Please try again."
                    : "Could not reach the AI service. Check the internet connection.");
        }
    }

    private String prompt(String question) {
        List<InventoryRow> rows = inventory.list(null, null, null, null, null);
        RecommendationResponse r = rules.build();
        StringBuilder p = new StringBuilder("Today is ").append(LocalDate.now()).append(".\n\nCURRENT STOCK (medicine | category | usable units | reorder level | earliest expiry with stock):\n");
        rows.stream().collect(Collectors.groupingBy(InventoryRow::medicineId)).values().stream().limit(80).forEach(batches -> {
            InventoryRow first = batches.get(0);
            long usable = batches.stream().filter(b -> b.daysToExpiry() >= 0).mapToLong(InventoryRow::quantity).sum();
            String expiry = batches.stream().filter(b -> b.quantity() > 0 && b.daysToExpiry() >= 0).map(b -> b.expiryDate().toString()).min(String::compareTo).orElse("none");
            p.append("- ").append(first.name()).append(" | ").append(first.category()).append(" | ").append(usable).append(" | ")
                    .append(first.reorderLevel()).append(" | ").append(expiry).append('\n');
        });
        p.append("\nOUR OWN RULE-BASED SUGGESTIONS:\n");
        r.reorders().stream().limit(15).forEach(x -> p.append("- Reorder ").append(x.medicine()).append(": about ").append(x.suggestedQty()).append(" units. ").append(x.reason()).append('\n'));
        r.expiryRisks().stream().limit(10).forEach(x -> p.append("- ").append(x.medicine()).append(" batch ").append(x.batchNumber()).append(": ")
                .append(x.atRiskUnits()).append(" units may expire unused on ").append(x.expiryDate()).append('\n'));
        r.slowMovers().stream().limit(10).forEach(x -> p.append("- ").append(x.medicine()).append(": ").append(x.usable()).append(" units, nothing used in 60 days\n"));
        if (question != null && !question.isBlank())
            p.append("\nTHE PHARMACIST'S QUESTION (answer this first and directly): ").append(question.replaceAll("[\\p{Cntrl}]", " ").trim()).append('\n');
        return p.toString();
    }
}