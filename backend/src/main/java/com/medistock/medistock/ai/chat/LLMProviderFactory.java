package com.medistock.medistock.ai.chat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class LLMProviderFactory {

    private static final Logger log = LoggerFactory.getLogger(LLMProviderFactory.class);

    @Value("${medistock.ai.provider:api}")
    private String preferredProvider;

    private final ApiLLMProvider apiLLMProvider;
    private final LocalLLMProvider localLLMProvider;

    public LLMProviderFactory(ApiLLMProvider apiLLMProvider, LocalLLMProvider localLLMProvider) {
        this.apiLLMProvider = apiLLMProvider;
        this.localLLMProvider = localLLMProvider;
    }

    /**
     * Resolves the active provider with dynamic fallback.
     */
    public LLMProvider getActiveProvider() {
        boolean preferLocal = "local".equalsIgnoreCase(preferredProvider) || "ollama".equalsIgnoreCase(preferredProvider);

        if (preferLocal) {
            if (localLLMProvider.isAvailable()) {
                return localLLMProvider;
            }
            log.info("Local Ollama preferred but offline. Checking External API...");
            if (apiLLMProvider.isAvailable()) {
                return apiLLMProvider;
            }
        } else {
            if (apiLLMProvider.isAvailable()) {
                return apiLLMProvider;
            }
            log.info("External API LLM preferred but unavailable. Checking Local Ollama...");
            if (localLLMProvider.isAvailable()) {
                return localLLMProvider;
            }
        }

        // Default to ApiLLMProvider (which handles offline/missing key gracefully)
        return preferLocal ? localLLMProvider : apiLLMProvider;
    }

    public boolean hasAnyLiveProvider() {
        return apiLLMProvider.isAvailable() || localLLMProvider.isAvailable();
    }
}

