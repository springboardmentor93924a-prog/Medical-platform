package com.medistock.medistock;

import com.medistock.medistock.dto.*;
import com.medistock.medistock.entity.*;
import com.medistock.medistock.repository.*;
import com.medistock.medistock.service.AiForecastingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AiForecastingServiceTests {

    @Autowired
    private AiForecastingService forecastingService;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private InventoryBatchRepository batchRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Should generate recommendations for all existing medicines")
    public void testRecommendationsGeneratedForAllMedicines() {
        List<AiInventoryRecommendationDto> recs = forecastingService.getRecommendations(null, null, null);
        assertNotNull(recs, "Recommendations list should not be null");
        assertFalse(recs.isEmpty(), "Should contain recommendations for medicines");

        for (AiInventoryRecommendationDto r : recs) {
            assertNotNull(r.getMedicineId());
            assertNotNull(r.getMedicineName());
            assertNotNull(r.getStatus());
            assertNotNull(r.getConfidenceScore());
            assertTrue(r.getConfidenceScore() >= 0 && r.getConfidenceScore() <= 100);
            assertNotNull(r.getExplanation());
            assertNotNull(r.getDaysOfCover());
        }
    }

    @Test
    @DisplayName("Should calculate executive summary with consistent counts")
    public void testExecutiveSummaryCounts() {
        AiForecastingSummaryDto summary = forecastingService.getSummary();
        assertNotNull(summary);
        assertTrue(summary.getTotalRecommendations() > 0);
        assertTrue(summary.getAverageConfidence() > 0);
        assertTrue(summary.getOverallAccuracy() > 0);

        long sumOfStatuses = summary.getCriticalShortagesCount() +
                summary.getReorderRecommendedCount() +
                summary.getOverstockedCount() +
                summary.getSlowMovingCount() +
                summary.getAdequateCount() +
                summary.getInsufficientDataCount();

        assertEquals(summary.getTotalRecommendations(), sumOfStatuses,
                "Sum of all classified statuses should match total recommendations");
    }

    @Test
    @DisplayName("Should generate 30-day Demand Forecast vs Actuals chart with confidence cone")
    public void testDemandForecastChartGeneration() {
        List<Medicine> meds = medicineRepository.findAll();
        assertFalse(meds.isEmpty());
        Integer medId = meds.get(0).getMedicineId();

        DemandForecastChartDto chart = forecastingService.getDemandForecastChart(medId, 30);
        assertNotNull(chart);
        assertEquals(medId, chart.getMedicineId());
        assertNotNull(chart.getPoints());
        assertFalse(chart.getPoints().isEmpty());

        // Should contain past points and future 30-day projection points
        long futurePoints = chart.getPoints().stream().filter(p -> !p.getIsHistorical()).count();
        assertEquals(30, futurePoints, "Future projection should contain 30 forecast points");

        // Future points should have confidence bands (lower <= forecast <= upper)
        chart.getPoints().stream().filter(p -> !p.getIsHistorical()).forEach(p -> {
            assertNotNull(p.getForecastedDemand());
            assertNotNull(p.getConfidenceLower());
            assertNotNull(p.getConfidenceUpper());
            assertTrue(p.getConfidenceLower() <= p.getForecastedDemand(), "Lower confidence bound must be <= forecasted demand");
            assertTrue(p.getConfidenceUpper() >= p.getForecastedDemand(), "Upper confidence bound must be >= forecasted demand");
            assertNull(p.getActualSales(), "Future points cannot have actual sales");
        });
    }

    @Test
    @Transactional
    @DisplayName("Pharmacist requisition should create PO in PENDING_APPROVAL without auto-approving")
    public void testRequisitionCreationWorkflow() {
        List<Medicine> meds = medicineRepository.findAll();
        assertFalse(meds.isEmpty());
        Medicine med = meds.get(0);

        User pharmacist = userRepository.findByEmail("pharmacist@medistock.com").orElse(null);

        AiReorderRequisitionRequest req = new AiReorderRequisitionRequest();
        req.setMedicineId(med.getMedicineId());
        req.setQuantity(250);
        req.setSupplierId(1);
        req.setExpectedDeliveryDate(LocalDate.now().plusDays(5));
        req.setNotes("AI replenishment requisition test");

        PurchaseOrder po = forecastingService.createRequisitionFromRecommendation(req, pharmacist);
        assertNotNull(po);
        assertNotNull(po.getPurchaseOrderId());
        assertEquals("PENDING_APPROVAL", po.getStatus(),
                "Purchase order must remain PENDING_APPROVAL and never automatically approve");
        assertEquals(1, po.getItems().size());
        assertEquals(250, po.getItems().get(0).getQuantity());
    }

    @Test
    @DisplayName("Filter recommendations by status correctly")
    public void testFilterByStatus() {
        List<AiInventoryRecommendationDto> critical = forecastingService.getRecommendations("CRITICAL_SHORTAGE", null, null);
        for (AiInventoryRecommendationDto r : critical) {
            assertEquals("CRITICAL_SHORTAGE", r.getStatus());
        }

        List<AiInventoryRecommendationDto> overstocked = forecastingService.getRecommendations("OVERSTOCKED", null, null);
        for (AiInventoryRecommendationDto r : overstocked) {
            assertEquals("OVERSTOCKED", r.getStatus());
        }
    }
}

