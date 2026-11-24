package com.medistock.medistock.ai;

import com.medistock.medistock.ai.risk.OverstockDetectionService;
import com.medistock.medistock.repository.InventoryBatchRepository;
import com.medistock.medistock.repository.MedicineRepository;
import com.medistock.medistock.repository.StockLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class OverstockDetectionServiceTest {

    private OverstockDetectionService overstockService;

    @BeforeEach
    void setUp() {
        var medRepo = Mockito.mock(MedicineRepository.class);
        var batchRepo = Mockito.mock(InventoryBatchRepository.class);
        var logRepo = Mockito.mock(StockLogRepository.class);
        overstockService = new OverstockDetectionService(medRepo, batchRepo, logRepo);
    }

    @Test
    @DisplayName("Overstock Detection: Correctly identifies inventory with high days of cover")
    void testOverstockDetection() {
        int usableStock = 1200;
        double adu = 5.0; // 240 days of cover!
        int leadTimeDays = 7;
        BigDecimal unitCost = BigDecimal.valueOf(15.00);

        var result = overstockService.analyze(1, "Metformin 500mg", usableStock, adu, leadTimeDays, unitCost);

        assertEquals(240.0, result.daysOfCover());
        assertTrue(result.isOverstocked());
        assertFalse(result.isSlowMoving());
        assertEquals("OVERSTOCKED", result.inventoryStatus());
        assertTrue(result.excessUnits() > 0);
        assertTrue(result.excessValue().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("Slow-Moving Detection: Identifies medicines with velocity < 0.2 units/day")
    void testSlowMovingDetection() {
        int usableStock = 80;
        double adu = 0.05; // very low dispensing velocity
        int leadTimeDays = 7;
        BigDecimal unitCost = BigDecimal.valueOf(25.00);

        var result = overstockService.analyze(2, "Rare Antibiotic Suspension", usableStock, adu, leadTimeDays, unitCost);

        assertTrue(result.isSlowMoving());
        assertEquals("SLOW_MOVING", result.inventoryStatus());
    }

    @Test
    @DisplayName("Optimal Stock: Healthy items are classified as ADEQUATE")
    void testAdequateStock() {
        int usableStock = 150;
        double adu = 5.0; // 30 days of cover
        int leadTimeDays = 7;
        BigDecimal unitCost = BigDecimal.valueOf(10.00);

        var result = overstockService.analyze(3, "Amoxicillin 500mg", usableStock, adu, leadTimeDays, unitCost);

        assertFalse(result.isOverstocked());
        assertFalse(result.isSlowMoving());
        assertEquals("ADEQUATE", result.inventoryStatus());
        assertEquals(0, result.excessUnits());
    }
}

