package com.medistock.medistock.ai;

import com.medistock.medistock.ai.reorder.ReorderCalculationService;
import com.medistock.medistock.repository.InventoryBatchRepository;
import com.medistock.medistock.repository.MedicineRepository;
import com.medistock.medistock.repository.PurchaseOrderItemRepository;
import com.medistock.medistock.repository.StockLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;

class ReorderCalculationServiceTest {

    private ReorderCalculationService reorderService;

    @BeforeEach
    void setUp() {
        var medRepo = Mockito.mock(MedicineRepository.class);
        var batchRepo = Mockito.mock(InventoryBatchRepository.class);
        var poItemRepo = Mockito.mock(PurchaseOrderItemRepository.class);
        var logRepo = Mockito.mock(StockLogRepository.class);
        reorderService = new ReorderCalculationService(medRepo, batchRepo, poItemRepo, logRepo);
    }

    @Test
    @DisplayName("Formula Verification: ROP = ADU * LT + SS and SS = z * sigma_d * sqrt(LT)")
    void testReorderFormula() {
        double adu = 15.0;
        int leadTime = 7;
        double stdDev = 4.0;
        double z = 1.65;
        // SS = ceil(1.65 * 4.0 * sqrt(7)) = ceil(1.65 * 4.0 * 2.64575) = ceil(17.46) = 18
        // Safeguard baseline = ceil(3 * 15) = 45 -> max(18, 45) = 45
        // ROP = ceil(15 * 7) + 45 = 105 + 45 = 150
        int usableStock = 80;
        int incomingStock = 20; // Net = 100 <= 150 (triggers reorder)

        var plan = reorderService.computeReorderPlan(
                1, "Paracetamol 500mg", adu, leadTime, stdDev, usableStock, incomingStock, z, 30
        );

        assertEquals(45, plan.safetyStock());
        assertEquals(150, plan.reorderPoint());
        assertEquals(100, plan.netAvailableStock());
        assertTrue(plan.reorderTriggered());
        assertTrue(plan.suggestedOrderQuantity() > 0);
        // Forecast 30 days = 450. Deficit = 450 + 45 - 100 = 395. Rounded to nearest 10 = 400.
        assertEquals(400, plan.suggestedOrderQuantity());
    }

    @Test
    @DisplayName("Healthy Stock: No reorder triggered when Net Available exceeds ROP")
    void testNoReorderWhenAdequate() {
        double adu = 5.0;
        int leadTime = 5;
        double stdDev = 1.0;
        int usableStock = 300;
        int incomingStock = 0;

        var plan = reorderService.computeReorderPlan(
                2, "Amoxicillin 250mg", adu, leadTime, stdDev, usableStock, incomingStock, 1.65, 30
        );

        assertFalse(plan.reorderTriggered());
        assertEquals(0, plan.suggestedOrderQuantity());
        assertEquals("ADEQUATE", plan.urgency());
    }

    @Test
    @DisplayName("Stockout Imminent: Flags critical urgency when usable stock is zero")
    void testStockoutImminent() {
        var plan = reorderService.computeReorderPlan(
                3, "Insulin Injection", 10.0, 7, 2.0, 0, 0, 1.65, 30
        );

        assertTrue(plan.reorderTriggered());
        assertEquals("STOCKOUT_IMMINENT", plan.urgency());
    }
}
