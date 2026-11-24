package com.medistock.medistock.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_DEMAND_FORECASTS = "ai_demand_forecasts";
    public static final String CACHE_INVENTORY_ANALYTICS = "ai_inventory_analytics";
    public static final String CACHE_WASTAGE_LOSS = "ai_wastage_loss";
    public static final String CACHE_SUPPLIER_DIRECTORY = "ai_supplier_directory";

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(
                CACHE_DEMAND_FORECASTS,
                CACHE_INVENTORY_ANALYTICS,
                CACHE_WASTAGE_LOSS,
                CACHE_SUPPLIER_DIRECTORY
        );
    }
}

