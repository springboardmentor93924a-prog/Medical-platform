package com.medistock.medistock.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class FefoRecommendationDto {

    private Integer medicineId;
    private String medicineName;
    private String brandName;
    private String genericName;
    private String categoryName;
    private Integer totalAvailableQuantity;
    private Integer requestedQuantity;
    private boolean canFulfillEntirely;
    private Integer fulfilledQuantity;
    private Integer remainingShortfall;

    // The primary FEFO recommended batch (oldest eligible batch)
    private AllocationPlanItem primaryRecommendation;

    // Full FEFO allocation plan breakdown (may span multiple batches if requestedQty > batch 1 available)
    private List<AllocationPlanItem> allocationPlan = new ArrayList<>();

    // Other eligible batches (sorted by expiry asc)
    private List<AllocationPlanItem> allEligibleBatches = new ArrayList<>();

    // Blocked batches (expired, quarantined, zero qty)
    private List<BlockedBatchItem> blockedBatches = new ArrayList<>();

    public static class AllocationPlanItem {
        private Integer batchId;
        private String batchNumber;
        private LocalDate expiryDate;
        private long daysUntilExpiry;
        private String daysLabel;
        private Integer availableQuantity;
        private Integer quantityToAllocate;
        private String recommendationLabel; // "Use first", "Next", "Later"
        private int fefoRank; // 1, 2, 3...
        private boolean isPrimary;

        public AllocationPlanItem() {}

        public Integer getBatchId() {
            return batchId;
        }

        public void setBatchId(Integer batchId) {
            this.batchId = batchId;
        }

        public String getBatchNumber() {
            return batchNumber;
        }

        public void setBatchNumber(String batchNumber) {
            this.batchNumber = batchNumber;
        }

        public LocalDate getExpiryDate() {
            return expiryDate;
        }

        public void setExpiryDate(LocalDate expiryDate) {
            this.expiryDate = expiryDate;
        }

        public long getDaysUntilExpiry() {
            return daysUntilExpiry;
        }

        public void setDaysUntilExpiry(long daysUntilExpiry) {
            this.daysUntilExpiry = daysUntilExpiry;
        }

        public String getDaysLabel() {
            return daysLabel;
        }

        public void setDaysLabel(String daysLabel) {
            this.daysLabel = daysLabel;
        }

        public Integer getAvailableQuantity() {
            return availableQuantity;
        }

        public void setAvailableQuantity(Integer availableQuantity) {
            this.availableQuantity = availableQuantity;
        }

        public Integer getQuantityToAllocate() {
            return quantityToAllocate;
        }

        public void setQuantityToAllocate(Integer quantityToAllocate) {
            this.quantityToAllocate = quantityToAllocate;
        }

        public String getRecommendationLabel() {
            return recommendationLabel;
        }

        public void setRecommendationLabel(String recommendationLabel) {
            this.recommendationLabel = recommendationLabel;
        }

        public int getFefoRank() {
            return fefoRank;
        }

        public void setFefoRank(int fefoRank) {
            this.fefoRank = fefoRank;
        }

        public boolean isPrimary() {
            return isPrimary;
        }

        public void setPrimary(boolean primary) {
            isPrimary = primary;
        }
    }

    public static class BlockedBatchItem {
        private Integer batchId;
        private String batchNumber;
        private LocalDate expiryDate;
        private Integer availableQuantity;
        private String blockReason; // "EXPIRED", "QUARANTINED", "RECALLED", "OUT_OF_STOCK"
        private String status;

        public BlockedBatchItem() {}

        public BlockedBatchItem(Integer batchId, String batchNumber, LocalDate expiryDate, Integer availableQuantity, String blockReason, String status) {
            this.batchId = batchId;
            this.batchNumber = batchNumber;
            this.expiryDate = expiryDate;
            this.availableQuantity = availableQuantity;
            this.blockReason = blockReason;
            this.status = status;
        }

        public Integer getBatchId() {
            return batchId;
        }

        public void setBatchId(Integer batchId) {
            this.batchId = batchId;
        }

        public String getBatchNumber() {
            return batchNumber;
        }

        public void setBatchNumber(String batchNumber) {
            this.batchNumber = batchNumber;
        }

        public LocalDate getExpiryDate() {
            return expiryDate;
        }

        public void setExpiryDate(LocalDate expiryDate) {
            this.expiryDate = expiryDate;
        }

        public Integer getAvailableQuantity() {
            return availableQuantity;
        }

        public void setAvailableQuantity(Integer availableQuantity) {
            this.availableQuantity = availableQuantity;
        }

        public String getBlockReason() {
            return blockReason;
        }

        public void setBlockReason(String blockReason) {
            this.blockReason = blockReason;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    public FefoRecommendationDto() {}

    public Integer getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(Integer medicineId) {
        this.medicineId = medicineId;
    }

    public String getMedicineName() {
        return medicineName;
    }

    public void setMedicineName(String medicineName) {
        this.medicineName = medicineName;
    }

    public String getBrandName() {
        return brandName;
    }

    public void setBrandName(String brandName) {
        this.brandName = brandName;
    }

    public String getGenericName() {
        return genericName;
    }

    public void setGenericName(String genericName) {
        this.genericName = genericName;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Integer getTotalAvailableQuantity() {
        return totalAvailableQuantity;
    }

    public void setTotalAvailableQuantity(Integer totalAvailableQuantity) {
        this.totalAvailableQuantity = totalAvailableQuantity;
    }

    public Integer getRequestedQuantity() {
        return requestedQuantity;
    }

    public void setRequestedQuantity(Integer requestedQuantity) {
        this.requestedQuantity = requestedQuantity;
    }

    public boolean isCanFulfillEntirely() {
        return canFulfillEntirely;
    }

    public void setCanFulfillEntirely(boolean canFulfillEntirely) {
        this.canFulfillEntirely = canFulfillEntirely;
    }

    public Integer getFulfilledQuantity() {
        return fulfilledQuantity;
    }

    public void setFulfilledQuantity(Integer fulfilledQuantity) {
        this.fulfilledQuantity = fulfilledQuantity;
    }

    public Integer getRemainingShortfall() {
        return remainingShortfall;
    }

    public void setRemainingShortfall(Integer remainingShortfall) {
        this.remainingShortfall = remainingShortfall;
    }

    public AllocationPlanItem getPrimaryRecommendation() {
        return primaryRecommendation;
    }

    public void setPrimaryRecommendation(AllocationPlanItem primaryRecommendation) {
        this.primaryRecommendation = primaryRecommendation;
    }

    public List<AllocationPlanItem> getAllocationPlan() {
        return allocationPlan;
    }

    public void setAllocationPlan(List<AllocationPlanItem> allocationPlan) {
        this.allocationPlan = allocationPlan;
    }

    public List<AllocationPlanItem> getAllEligibleBatches() {
        return allEligibleBatches;
    }

    public void setAllEligibleBatches(List<AllocationPlanItem> allEligibleBatches) {
        this.allEligibleBatches = allEligibleBatches;
    }

    public List<BlockedBatchItem> getBlockedBatches() {
        return blockedBatches;
    }

    public void setBlockedBatches(List<BlockedBatchItem> blockedBatches) {
        this.blockedBatches = blockedBatches;
    }
}

