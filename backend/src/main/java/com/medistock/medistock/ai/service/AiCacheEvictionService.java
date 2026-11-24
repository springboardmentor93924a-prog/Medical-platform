package com.medistock.medistock.ai.service;

import com.medistock.medistock.config.CacheConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

@Service
public class AiCacheEvictionService {

    private static final Logger log = LoggerFactory.getLogger(AiCacheEvictionService.class);

    @CacheEvict(value = {
            CacheConfig.CACHE_DEMAND_FORECASTS,
            CacheConfig.CACHE_INVENTORY_ANALYTICS,
            CacheConfig.CACHE_WASTAGE_LOSS
    }, allEntries = true)
    public void evictInventoryCaches() {
        log.debug("Evicted AI inventory analytics, demand forecasts, and wastage caches.");
    }

    @CacheEvict(value = CacheConfig.CACHE_SUPPLIER_DIRECTORY, allEntries = true)
    public void evictSupplierCache() {
        log.debug("Evicted AI supplier directory cache.");
    }

    @CacheEvict(value = {
            CacheConfig.CACHE_DEMAND_FORECASTS,
            CacheConfig.CACHE_INVENTORY_ANALYTICS,
            CacheConfig.CACHE_WASTAGE_LOSS,
            CacheConfig.CACHE_SUPPLIER_DIRECTORY
    }, allEntries = true)
    public void evictAllAiCaches() {
        log.info("Evicted all MediStock AI caches.");
    }
}

