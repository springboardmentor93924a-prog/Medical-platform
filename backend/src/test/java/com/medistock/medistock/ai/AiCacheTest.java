package com.medistock.medistock.ai;

import com.medistock.medistock.ai.service.AiCacheEvictionService;
import com.medistock.medistock.config.CacheConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AiCacheTest {

    private CacheConfig cacheConfig;
    private CacheManager cacheManager;
    private AiCacheEvictionService evictionService;

    @BeforeEach
    void setUp() {
        cacheConfig = new CacheConfig();
        cacheManager = cacheConfig.cacheManager();
        evictionService = new AiCacheEvictionService();
    }

    @Test
    @DisplayName("Cache Configuration: Registers all AI analytical caches")
    void testCacheRegistration() {
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_DEMAND_FORECASTS));
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_INVENTORY_ANALYTICS));
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_WASTAGE_LOSS));
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_SUPPLIER_DIRECTORY));
    }

    @Test
    @DisplayName("Cache Operations: Stores and retrieves analytical computations")
    void testCacheStoreAndRetrieve() {
        Cache forecastCache = cacheManager.getCache(CacheConfig.CACHE_DEMAND_FORECASTS);
        assertNotNull(forecastCache);

        forecastCache.put("1_30", Map.of("medicineId", 1, "predictedDemand", 120.0));

        Cache.ValueWrapper val = forecastCache.get("1_30");
        assertNotNull(val);
        @SuppressWarnings("unchecked")
        Map<String, Object> cachedData = (Map<String, Object>) val.get();
        assertEquals(1, cachedData.get("medicineId"));
        assertEquals(120.0, cachedData.get("predictedDemand"));
    }

    @Test
    @DisplayName("Cache Eviction: Successfully clears entries on eviction trigger")
    void testCacheEviction() {
        Cache analyticsCache = cacheManager.getCache(CacheConfig.CACHE_INVENTORY_ANALYTICS);
        assertNotNull(analyticsCache);

        analyticsCache.put("summary", Map.of("totalUsableUnits", 5000));
        assertNotNull(analyticsCache.get("summary"));

        analyticsCache.clear();
        assertNull(analyticsCache.get("summary"));
    }
}

