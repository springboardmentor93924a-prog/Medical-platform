
package com.medistock.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "suppliers")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "supplier_id")
    private Long supplierId;

    @Column(name = "supplier_name", nullable = false, length = 150)
    private String supplierName;

    @Column(name = "contact_number", length = 20)
    private String contactNumber;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "profile_image_url", length = 500)
private String profileImageUrl;


    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Boolean getActive() {
        return active;
    }

    @Transient
    public String getPhone() {
        return contactNumber;
    }

    public void setPhone(String phone) {
        if (this.contactNumber == null || this.contactNumber.isBlank()) {
            this.contactNumber = phone;
        }
    }

    public String getProfileImageUrl() {
    return profileImageUrl;
}

public void setProfileImageUrl(String profileImageUrl) {
    this.profileImageUrl = profileImageUrl;
}

    public void setActive(Boolean active) {
        this.active = active;
    }


    @Column(name = "medicines", length = 500)
private String medicines;

public String getMedicines() {
    return medicines;
}

public void setMedicines(String medicines) {
    this.medicines = medicines;
}
}
