package com.medistock.medistock_backend.dto;

import lombok.Data;

@Data
public class SupplierRequest {
    private String name;
    private String contactPerson;
    private String email;
    private String password;
    private String phone;
    private String address;
    private String licenseNumber;
    private Integer leadTimeDays;
    private Double rating;
}