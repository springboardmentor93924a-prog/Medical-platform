package com.medistock.dto.backup;

import java.time.LocalDateTime;

public class SupplierSnapshot {
    private Long id;
    private String companyName;
    private String contactPerson;
    private String email;
    private String phone;
    private String address;
    private String drugLicenseNumber;
    private String status;
    private Double rating;
    private String userEmail;
    private LocalDateTime createdAt;

    public SupplierSnapshot() {}

    public SupplierSnapshot(Long id, String companyName, String contactPerson, String email, String phone,
                            String address, String drugLicenseNumber, String status, Double rating,
                            String userEmail, LocalDateTime createdAt) {
        this.id = id;
        this.companyName = companyName;
        this.contactPerson = contactPerson;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.drugLicenseNumber = drugLicenseNumber;
        this.status = status;
        this.rating = rating;
        this.userEmail = userEmail;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getDrugLicenseNumber() { return drugLicenseNumber; }
    public void setDrugLicenseNumber(String drugLicenseNumber) { this.drugLicenseNumber = drugLicenseNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
