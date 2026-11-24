package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "return_inspections")
public class ReturnInspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inspection_id")
    private Integer inspectionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_id", nullable = false)
    private MedicineReturn medicineReturn;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inspector_id", nullable = false)
    private User inspector;

    @Column(name = "inspection_type", nullable = false, length = 50)
    private String inspectionType;

    @Column(name = "packaging_intact", nullable = false)
    private Boolean packagingIntact = true;

    @Column(name = "temperature_maintained", nullable = false)
    private Boolean temperatureMaintained = true;

    @Column(name = "batch_verified", nullable = false)
    private Boolean batchVerified = true;

    @Column(name = "passed", nullable = false)
    private Boolean passed = false;

    @Column(name = "findings", columnDefinition = "TEXT")
    private String findings;

    @Column(name = "inspected_at", insertable = false, updatable = false)
    private LocalDateTime inspectedAt;

    public ReturnInspection() {}

    public Integer getInspectionId() {
        return inspectionId;
    }

    public void setInspectionId(Integer inspectionId) {
        this.inspectionId = inspectionId;
    }

    public MedicineReturn getMedicineReturn() {
        return medicineReturn;
    }

    public void setMedicineReturn(MedicineReturn medicineReturn) {
        this.medicineReturn = medicineReturn;
    }

    public User getInspector() {
        return inspector;
    }

    public void setInspector(User inspector) {
        this.inspector = inspector;
    }

    public String getInspectionType() {
        return inspectionType;
    }

    public void setInspectionType(String inspectionType) {
        this.inspectionType = inspectionType;
    }

    public Boolean getPackagingIntact() {
        return packagingIntact;
    }

    public void setPackagingIntact(Boolean packagingIntact) {
        this.packagingIntact = packagingIntact;
    }

    public Boolean getTemperatureMaintained() {
        return temperatureMaintained;
    }

    public void setTemperatureMaintained(Boolean temperatureMaintained) {
        this.temperatureMaintained = temperatureMaintained;
    }

    public Boolean getBatchVerified() {
        return batchVerified;
    }

    public void setBatchVerified(Boolean batchVerified) {
        this.batchVerified = batchVerified;
    }

    public Boolean getPassed() {
        return passed;
    }

    public void setPassed(Boolean passed) {
        this.passed = passed;
    }

    public String getFindings() {
        return findings;
    }

    public void setFindings(String findings) {
        this.findings = findings;
    }

    public LocalDateTime getInspectedAt() {
        return inspectedAt;
    }

    public void setInspectedAt(LocalDateTime inspectedAt) {
        this.inspectedAt = inspectedAt;
    }
}

