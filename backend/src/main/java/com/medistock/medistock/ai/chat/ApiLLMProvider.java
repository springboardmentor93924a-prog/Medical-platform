package com.medistock.medistock.ai.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medistock.medistock.ai.dto.ChatMessageDto;
import com.medistock.medistock.ai.tools.ChatToolRegistry.ToolDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Component
public class ApiLLMProvider implements LLMProvider {

    private static final Logger log = LoggerFactory.getLogger(ApiLLMProvider.class);

    @Value("${medistock.ai.api.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    @Value("${medistock.ai.api.key:}")
    private String apiKey;

    @Value("${medistock.ai.api.model:gpt-4o-mini}")
    private String modelName;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public ApiLLMProvider() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public String getProviderName() {
        return "EXTERNAL_API_LLM";
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equalsIgnoreCase("demo-key") && !apiKey.equalsIgnoreCase("none");
    }

    @Override
    public ChatCompletionResult generateResponse(List<ChatMessageDto> messages, List<ToolDefinition> tools) {
        if (!isAvailable()) {
            return ChatCompletionResult.text("External API LLM is not configured with an active API key.", getProviderName());
        }

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);

            List<Map<String, String>> msgList = new ArrayList<>();
            for (ChatMessageDto m : messages) {
                if (m.getContent() != null) {
                    msgList.add(Map.of("role", m.getRole(), "content", m.getContent()));
                }
            }
            requestBody.put("messages", msgList);

            if (tools != null && !tools.isEmpty()) {
                List<Map<String, Object>> toolsPayload = new ArrayList<>();
                for (ToolDefinition t : tools) {
                    toolsPayload.add(Map.of(
                            "type", "function",
                            "function", Map.of(
                                    "name", t.name(),
                                    "description", t.description(),
                                    "parameters", t.parameters()
                            )
                    ));
                }
                requestBody.put("tools", toolsPayload);
            }

            String jsonPayload = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl.replaceAll("/$", "") + "/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .timeout(Duration.ofSeconds(20))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode choice = root.path("choices").get(0);
                JsonNode message = choice.path("message");

                JsonNode toolCalls = message.path("tool_calls");
                if (toolCalls.isArray() && !toolCalls.isEmpty()) {
                    JsonNode firstCall = toolCalls.get(0);
                    String functionName = firstCall.path("function").path("name").asText();
                    String argsStr = firstCall.path("function").path("arguments").asText("{}");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> args = objectMapper.readValue(argsStr, Map.class);
                    return ChatCompletionResult.toolCall(functionName, args, getProviderName());
                }

                String content = message.path("content").asText();
                return ChatCompletionResult.text(content, getProviderName());
            } else {
                log.warn("External API LLM responded with HTTP {}: {}", response.statusCode(), response.body());
                return ChatCompletionResult.text(null, getProviderName());
            }
        } catch (Exception e) {
            log.error("Failed to connect to External API LLM: {}", e.getMessage());
            return ChatCompletionResult.text(null, getProviderName());
        }
    }
}
