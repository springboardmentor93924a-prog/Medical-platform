package com.medistock.medistock.ai.chat;

import com.medistock.medistock.ai.dto.ChatMessageDto;
import com.medistock.medistock.ai.tools.ChatToolRegistry.ToolDefinition;

import java.util.List;
import java.util.Map;

public interface LLMProvider {

    record ChatCompletionResult(
            String content,
            String toolCallName,
            Map<String, Object> toolCallArguments,
            String providerUsed,
            boolean hasToolCall
    ) {
        public static ChatCompletionResult text(String content, String provider) {
            return new ChatCompletionResult(content, null, null, provider, false);
        }

        public static ChatCompletionResult toolCall(String toolName, Map<String, Object> arguments, String provider) {
            return new ChatCompletionResult(null, toolName, arguments, provider, true);
        }
    }

    String getProviderName();

    boolean isAvailable();

    ChatCompletionResult generateResponse(List<ChatMessageDto> messages, List<ToolDefinition> tools);
}

