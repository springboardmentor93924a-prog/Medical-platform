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
public class LocalLLMProvider implements LLMProvider {

    private static final Logger log = LoggerFactory.getLogger(LocalLLMProvider.class);

    @Value("${medistock.ai.local.base-url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${medistock.ai.local.model:llama3}")
    private String modelName;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public LocalLLMProvider() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public String getProviderName() {
        return "LOCAL_OLLAMA";
    }

    @Override
    public boolean isAvailable() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ollamaUrl.replaceAll("/$", "") + "/api/tags"))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();

            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public ChatCompletionResult generateResponse(List<ChatMessageDto> messages, List<ToolDefinition> tools) {
        if (!isAvailable()) {
            return ChatCompletionResult.text("Local Ollama service is currently offline or unreachable at " + ollamaUrl, getProviderName());
        }

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);
            requestBody.put("stream", false);

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
                    .uri(URI.create(ollamaUrl.replaceAll("/$", "") + "/api/chat"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode message = root.path("message");

                JsonNode toolCalls = message.path("tool_calls");
                if (toolCalls.isArray() && !toolCalls.isEmpty()) {
                    JsonNode firstCall = toolCalls.get(0);
                    String functionName = firstCall.path("function").path("name").asText();
                    JsonNode argsNode = firstCall.path("function").path("arguments");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> args = objectMapper.convertValue(argsNode, Map.class);
                    return ChatCompletionResult.toolCall(functionName, args, getProviderName());
                }

                String content = message.path("content").asText();
                return ChatCompletionResult.text(content, getProviderName());
            } else {
                log.warn("Ollama responded with HTTP {}: {}", response.statusCode(), response.body());
                return ChatCompletionResult.text(null, getProviderName());
            }
        } catch (Exception e) {
            log.error("Ollama inference failed: {}", e.getMessage());
            return ChatCompletionResult.text(null, getProviderName());
        }
    }
}
