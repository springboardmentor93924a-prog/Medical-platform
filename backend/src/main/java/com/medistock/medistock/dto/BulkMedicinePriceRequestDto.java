package com.medistock.medistock.dto;

import java.math.BigDecimal;

public class BulkMedicinePriceRequestDto {

    private Integer supplierId;
    private String pricingMode;
    private BigDecimal value;

    public Integer getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Integer supplierId) {
        this.supplierId = supplierId;
    }

    public String getPricingMode() {
        return pricingMode;
    }

    public void setPricingMode(String pricingMode) {
        this.pricingMode = pricingMode;
    }

    public BigDecimal getValue() {
        return value;
    }

    public void setValue(BigDecimal value) {
        this.value = value;
    }
}
