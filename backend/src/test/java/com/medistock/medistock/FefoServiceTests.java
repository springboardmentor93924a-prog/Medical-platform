package com.medistock.medistock;

import com.medistock.medistock.dto.FefoAllocationRequest;
import com.medistock.medistock.dto.FefoRecommendationDto;
import com.medistock.medistock.entity.FefoAllocation;
import com.medistock.medistock.entity.InventoryBatch;
import com.medistock.medistock.entity.Medicine;
import com.medistock.medistock.repository.FefoAllocationRepository;
import com.medistock.medistock.repository.InventoryBatchRepository;
import com.medistock.medistock.repository.MedicineRepository;
import com.medistock.medistock.service.FefoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class FefoServiceTests {

    @Autowired
    private FefoService fefoService;

    @Autowired
    private InventoryBatchRepository inventoryBatchRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private FefoAllocationRepository fefoAllocationRepository;

    private Medicine testMedicine;
    private InventoryBatch expiredBatch;
    private InventoryBatch earlyBatch;
    private InventoryBatch midBatch;
    private InventoryBatch lateBatch;
    private InventoryBatch quarantinedBatch;

    @BeforeEach
    void setupTestData() {
        // Create test medicine
        Medicine med = new Medicine();
        med.setMedicineName("FEFO Test Amoxicillin " + System.currentTimeMillis());
        med.setGenericName("Amoxicillin Test");
        med.setStrength("500mg");
        med.setDosageForm("Capsule");
        med.setCategoryId(1);
        testMedicine = medicineRepository.save(med);

        LocalDate today = LocalDate.now();

        // 1. Expired Batch (Should be blocked)
        expiredBatch = new InventoryBatch();
        expiredBatch.setMedicineId(testMedicine.getMedicineId());
        expiredBatch.setBatchNumber("TEST-EXP-" + System.currentTimeMillis());
        expiredBatch.setExpiryDate(today.minusDays(10));
        expiredBatch.setQuantityReceived(100);
        expiredBatch.setQuantityAvailable(50);
        expiredBatch.setStatus("EXPIRED");
        expiredBatch.setPurchaseCost(BigDecimal.valueOf(5.0));
        expiredBatch.setSellingPrice(BigDecimal.valueOf(10.0));
        expiredBatch = inventoryBatchRepository.save(expiredBatch);

        // 2. Early Batch (Earliest eligible: e.g. +15 days) -> Should be "Use first"
        earlyBatch = new InventoryBatch();
        earlyBatch.setMedicineId(testMedicine.getMedicineId());
        earlyBatch.setBatchNumber("TEST-EARLY-" + System.currentTimeMillis());
        earlyBatch.setExpiryDate(today.plusDays(15));
        earlyBatch.setQuantityReceived(100);
        earlyBatch.setQuantityAvailable(40);
        earlyBatch.setStatus("ACTIVE");
        earlyBatch.setPurchaseCost(BigDecimal.valueOf(5.0));
        earlyBatch.setSellingPrice(BigDecimal.valueOf(10.0));
        earlyBatch = inventoryBatchRepository.save(earlyBatch);

        // 3. Mid Batch (+60 days) -> Should be "Next"
        midBatch = new InventoryBatch();
        midBatch.setMedicineId(testMedicine.getMedicineId());
        midBatch.setBatchNumber("TEST-MID-" + System.currentTimeMillis());
        midBatch.setExpiryDate(today.plusDays(60));
        midBatch.setQuantityReceived(200);
        midBatch.setQuantityAvailable(100);
        midBatch.setStatus("ACTIVE");
        midBatch.setPurchaseCost(BigDecimal.valueOf(5.0));
        midBatch.setSellingPrice(BigDecimal.valueOf(10.0));
        midBatch = inventoryBatchRepository.save(midBatch);

        // 4. Late Batch (+365 days) -> Should be "Later"
        lateBatch = new InventoryBatch();
        lateBatch.setMedicineId(testMedicine.getMedicineId());
        lateBatch.setBatchNumber("TEST-LATE-" + System.currentTimeMillis());
        lateBatch.setExpiryDate(today.plusDays(365));
        lateBatch.setQuantityReceived(300);
        lateBatch.setQuantityAvailable(150);
        lateBatch.setStatus("ACTIVE");
        lateBatch.setPurchaseCost(BigDecimal.valueOf(5.0));
        lateBatch.setSellingPrice(BigDecimal.valueOf(10.0));
        lateBatch = inventoryBatchRepository.save(lateBatch);

        // 5. Quarantined Batch (Active expiry date but quarantined status) -> Should be blocked
        quarantinedBatch = new InventoryBatch();
        quarantinedBatch.setMedicineId(testMedicine.getMedicineId());
        quarantinedBatch.setBatchNumber("TEST-QUAR-" + System.currentTimeMillis());
        quarantinedBatch.setExpiryDate(today.plusDays(30));
        quarantinedBatch.setQuantityReceived(50);
        quarantinedBatch.setQuantityAvailable(50);
        quarantinedBatch.setStatus("QUARANTINED");
        quarantinedBatch.setPurchaseCost(BigDecimal.valueOf(5.0));
        quarantinedBatch.setSellingPrice(BigDecimal.valueOf(10.0));
        quarantinedBatch = inventoryBatchRepository.save(quarantinedBatch);
    }

    @Test
    @DisplayName("FEFO Recommendation: Earliest expiring eligible batch is recommended first, expired/quarantined blocked")
    void testFefoRecommendationOrder() {
        FefoRecommendationDto rec = fefoService.getRecommendation(testMedicine.getMedicineId(), 30, null);

        assertNotNull(rec);
        assertEquals(testMedicine.getMedicineId(), rec.getMedicineId());
        assertNotNull(rec.getPrimaryRecommendation(), "Should recommend earliest eligible batch");
        assertEquals(earlyBatch.getBatchId(), rec.getPrimaryRecommendation().getBatchId(), "Early batch must be primary recommendation");
        assertEquals("Use first", rec.getPrimaryRecommendation().getRecommendationLabel());

        // Verify eligible batches are sorted ascending by expiry
        List<FefoRecommendationDto.AllocationPlanItem> eligible = rec.getAllEligibleBatches();
        assertEquals(3, eligible.size(), "Should have 3 eligible batches (early, mid, late)");
        assertEquals(earlyBatch.getBatchId(), eligible.get(0).getBatchId());
        assertEquals(midBatch.getBatchId(), eligible.get(1).getBatchId());
        assertEquals(lateBatch.getBatchId(), eligible.get(2).getBatchId());

        // Verify blocked batches contains expired and quarantined
        List<FefoRecommendationDto.BlockedBatchItem> blocked = rec.getBlockedBatches();
        assertTrue(blocked.stream().anyMatch(b -> b.getBatchId().equals(expiredBatch.getBatchId())), "Expired batch must be blocked");
        assertTrue(blocked.stream().anyMatch(b -> b.getBatchId().equals(quarantinedBatch.getBatchId())), "Quarantined batch must be blocked");
    }

    @Test
    @DisplayName("FEFO Allocation: Automatically allocates from earliest batch first")
    void testAutoFefoAllocation() {
        FefoAllocationRequest req = new FefoAllocationRequest();
        req.setMedicineId(testMedicine.getMedicineId());
        req.setRequestedQuantity(20);
        req.setReferenceType("TEST_PRESCRIPTION");

        List<FefoAllocation> allocs = fefoService.allocateStock(req, 2, null);

        assertNotNull(allocs);
        assertEquals(1, allocs.size());
        FefoAllocation alloc = allocs.get(0);
        assertEquals(earlyBatch.getBatchId(), alloc.getBatchId(), "Must allocate from earliest batch");
        assertEquals(20, alloc.getAllocatedQuantity());
        assertTrue(alloc.getIsFefoCompliant(), "Auto FEFO allocation must be marked compliant");

        // Verify stock deducted
        InventoryBatch updated = inventoryBatchRepository.findById(earlyBatch.getBatchId()).orElseThrow();
        assertEquals(20, updated.getQuantityAvailable(), "Available should be reduced from 40 to 20");
    }

    @Test
    @DisplayName("FEFO Multi-batch split: Allocates across earliest batches when requested > batch 1 available")
    void testMultiBatchAllocation() {
        // Request 60 units (early batch has 40, mid batch has 100) -> should allocate 40 from early and 20 from mid
        FefoAllocationRequest req = new FefoAllocationRequest();
        req.setMedicineId(testMedicine.getMedicineId());
        req.setRequestedQuantity(60);

        List<FefoAllocation> allocs = fefoService.allocateStock(req, 2, null);

        assertEquals(2, allocs.size(), "Should split across 2 batches");
        assertEquals(earlyBatch.getBatchId(), allocs.get(0).getBatchId());
        assertEquals(40, allocs.get(0).getAllocatedQuantity());
        assertEquals(midBatch.getBatchId(), allocs.get(1).getBatchId());
        assertEquals(20, allocs.get(1).getAllocatedQuantity());

        // Early batch should now be DEPLETED
        InventoryBatch updatedEarly = inventoryBatchRepository.findById(earlyBatch.getBatchId()).orElseThrow();
        assertEquals(0, updatedEarly.getQuantityAvailable());
        assertEquals("DEPLETED", updatedEarly.getStatus());

        // Mid batch should have 80 left
        InventoryBatch updatedMid = inventoryBatchRepository.findById(midBatch.getBatchId()).orElseThrow();
        assertEquals(80, updatedMid.getQuantityAvailable());
    }

    @Test
    @DisplayName("FEFO Enforcement: Rejects allocation of expired batch")
    void testCannotAllocateExpiredBatch() {
        FefoAllocationRequest req = new FefoAllocationRequest();
        req.setMedicineId(testMedicine.getMedicineId());
        req.setSelectedBatchId(expiredBatch.getBatchId());
        req.setRequestedQuantity(10);

        Exception ex = assertThrows(IllegalArgumentException.class, () -> fefoService.allocateStock(req, 2, null));
        assertTrue(ex.getMessage().contains("expired"), "Exception message should indicate expired batch");
    }

    @Test
    @DisplayName("FEFO Enforcement: Rejects allocation of quarantined batch")
    void testCannotAllocateQuarantinedBatch() {
        FefoAllocationRequest req = new FefoAllocationRequest();
        req.setMedicineId(testMedicine.getMedicineId());
        req.setSelectedBatchId(quarantinedBatch.getBatchId());
        req.setRequestedQuantity(10);

        Exception ex = assertThrows(IllegalArgumentException.class, () -> fefoService.allocateStock(req, 2, null));
        assertTrue(ex.getMessage().contains("QUARANTINED"), "Exception message should indicate quarantined batch");
    }

    @Test
    @DisplayName("FEFO Deviation Alert: Flagged when earlier-expiring batch is skipped")
    void testDeviationWhenEarlierBatchSkipped() {
        FefoAllocationRequest req = new FefoAllocationRequest();
        req.setMedicineId(testMedicine.getMedicineId());
        req.setSelectedBatchId(lateBatch.getBatchId()); // Skipping earlyBatch and midBatch!
        req.setRequestedQuantity(15);
        req.setOverrideReason("Doctor specifically requested late-dated formulation");

        List<FefoAllocation> allocs = fefoService.allocateStock(req, 2, null);

        assertEquals(1, allocs.size());
        FefoAllocation alloc = allocs.get(0);
        assertFalse(alloc.getIsFefoCompliant(), "Allocation should be flagged non-compliant");
        assertEquals(earlyBatch.getBatchId(), alloc.getRecommendedBatchId(), "Recommended batch was earlyBatch");
        assertNotNull(alloc.getOverrideReason(), "Override reason should be saved");
    }

    @Test
    @DisplayName("FEFO Insufficient Stock: Throws exception when requested > total available")
    void testInsufficientStockThrowsException() {
        FefoAllocationRequest req = new FefoAllocationRequest();
        req.setMedicineId(testMedicine.getMedicineId());
        req.setRequestedQuantity(9999); // Total available is only 290

        assertThrows(IllegalStateException.class, () -> fefoService.allocateStock(req, 2, null));
    }

    @Test
    @DisplayName("FEFO Concurrency Safety: Multiple concurrent allocations do not cause overselling")
    void testConcurrentAllocations() throws InterruptedException {
        int threads = 5;
        int qtyPerThread = 8; // Total requested = 40 (exact amount in earlyBatch)

        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                try {
                    latch.await();
                    FefoAllocationRequest req = new FefoAllocationRequest();
                    req.setMedicineId(testMedicine.getMedicineId());
                    req.setSelectedBatchId(earlyBatch.getBatchId());
                    req.setRequestedQuantity(qtyPerThread);
                    fefoService.allocateStock(req, 2, null);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    System.err.println("Concurrent thread failed: " + e.getClass().getName() + " - " + e.getMessage());
                    e.printStackTrace();
                    failCount.incrementAndGet();
                }
            });
        }

        latch.countDown();
        executor.shutdown();
        assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS));

        InventoryBatch updated = inventoryBatchRepository.findById(earlyBatch.getBatchId()).orElseThrow();
        assertEquals(0, updated.getQuantityAvailable(), "Early batch stock should be exactly 0 (no negative stock)");
        assertEquals(5, successCount.get(), "All 5 concurrent requests of 8 units should succeed for 40 units");
    }
}
