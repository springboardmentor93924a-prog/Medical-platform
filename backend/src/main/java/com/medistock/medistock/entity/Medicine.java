package com.medistock.medistock.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "medicine")
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "medicine_id")
    private Integer medicineId;

    @Column(name = "medicine_name", nullable = false, length = 150)
    private String medicineName;

    @Column(name = "medicine_code", length = 50, unique = true)
    private String medicineCode;

    @Column(name = "manufacturer", length = 150)
    private String manufacturer;

    @Column(name = "generic_name", length = 150)
    private String genericName;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "uses", columnDefinition = "TEXT")
    private String uses;

    @Column(name = "dosage", length = 100)
    private String dosage;

    @Column(name = "side_effects", columnDefinition = "TEXT")
    private String sideEffects;

    @Column(name = "precautions", columnDefinition = "TEXT")
    private String precautions;

    @Column(name = "prescription_required")
    private Boolean prescriptionRequired = false;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category categoryEntity;

    public Medicine() {
    }

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

    public String getMedicineCode() {
        return medicineCode;
    }

    public void setMedicineCode(String medicineCode) {
        this.medicineCode = medicineCode;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public String getGenericName() {
        return genericName;
    }

    public void setGenericName(String genericName) {
        this.genericName = genericName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getUses() {
        return uses;
    }

    public void setUses(String uses) {
        this.uses = uses;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public String getSideEffects() {
        return sideEffects;
    }

    public void setSideEffects(String sideEffects) {
        this.sideEffects = sideEffects;
    }

    public String getPrecautions() {
        return precautions;
    }

    public void setPrecautions(String precautions) {
        this.precautions = precautions;
    }

    public Boolean getPrescriptionRequired() {
        return prescriptionRequired;
    }

    public void setPrescriptionRequired(Boolean prescriptionRequired) {
        this.prescriptionRequired = prescriptionRequired;
    }

    public Category getCategoryEntity() {
        return categoryEntity;
    }

    public void setCategoryEntity(Category categoryEntity) {
        this.categoryEntity = categoryEntity;
    }
}
