package com.medistock.medistock.ai;

import com.medistock.medistock.ai.risk.ExpiryRiskService;
import com.medistock.medistock.entity.InventoryBatch;
import com.medistock.medistock.repository.InventoryBatchRepository;
import com.medistock.medistock.repository.MedicineRepository;
import com.medistock.medistock.repository.StockLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ExpiryRiskServiceTest {

    private ExpiryRiskService riskService;

    @BeforeEach
    void setUp() {
        var medRepo = Mockito.mock(MedicineRepository.class);
        var batchRepo = Mockito.mock(InventoryBatchRepository.class);
        var logRepo = Mockito.mock(StockLogRepository.class);
        riskService = new ExpiryRiskService(medRepo, batchRepo, logRepo);
    }

    @Test
    @DisplayName("FEFO Expiry Simulation: Correctly flags batch units that risk expiring before consumption")
    void testExpiryRiskSimulation() {
        LocalDate today = LocalDate.now();

        // Batch 1: 100 units, expires in 5 days
        InventoryBatch b1 = new InventoryBatch();
        b1.setBatchId(101);
        b1.setBatchNumber("B001");
        b1.setQuantityAvailable(100);
        b1.setExpiryDate(today.plusDays(5));
        b1.setPurchaseCost(BigDecimal.valueOf(10.00));

        // Batch 2: 200 units, expires in 200 days
        InventoryBatch b2 = new InventoryBatch();
        b2.setBatchId(102);
        b2.setBatchNumber("B002");
        b2.setQuantityAvailable(200);
        b2.setExpiryDate(today.plusDays(200));
        b2.setPurchaseCost(BigDecimal.valueOf(10.00));

        // ADU = 10 units/day. In 5 days, only 50 units of B1 can be consumed. Remaining 50 units will expire!
        var report = riskService.evaluateExpiryRisk(1, "Paracetamol 500mg", 10.0, List.of(b1, b2), today);

        assertEquals(300, report.totalStock());
        assertEquals(50, report.totalUnitsAtRisk());
        assertEquals(BigDecimal.valueOf(500.00).setScale(2), report.totalFinancialRisk());

        var b1Item = report.batchDetails().get(0);
        assertEquals("B001", b1Item.batchNumber());
        assertEquals("CRITICAL_7_DAYS", b1Item.riskCategory());
        assertEquals(50, b1Item.unitsAtRisk());

        var b2Item = report.batchDetails().get(1);
        assertEquals("B002", b2Item.batchNumber());
        assertEquals("HEALTHY", b2Item.riskCategory());
        assertEquals(0, b2Item.unitsAtRisk());
    }

    @Test
    @DisplayName("Expired Batch: 100% units flagged as EXPIRED with immediate quarantine recommendation")
    void testExpiredBatchHandling() {
        LocalDate today = LocalDate.now();

        InventoryBatch b = new InventoryBatch();
        b.setBatchId(201);
        b.setBatchNumber("EXP-01");
        b.setQuantityAvailable(80);
        b.setExpiryDate(today.minusDays(3)); // already expired
        b.setPurchaseCost(BigDecimal.valueOf(5.00));

        var report = riskService.evaluateExpiryRisk(2, "Cetirizine 10mg", 5.0, List.of(b), today);

        assertEquals(80, report.totalUnitsAtRisk());
        assertEquals("EXPIRED", report.batchDetails().get(0).riskCategory());
        assertTrue(report.batchDetails().get(0).actionRecommendation().contains("BLOCKED"));
    }
}
