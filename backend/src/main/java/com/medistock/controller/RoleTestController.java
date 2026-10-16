
package com.medistock.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RoleTestController {

    @GetMapping("/admin/test")
    public String adminTest() {
        return "ADMIN access successful!";
    }

    @GetMapping("/medicines/test")
    public String medicinesTest() {
        return "Medicine access successful!";
    }

    @GetMapping("/inventory/test")
    public String inventoryTest() {
        return "Inventory access successful!";
    }

    @GetMapping("/supplier/test")
    public String supplierTest() {
        return "SUPPLIER access successful!";
    }
}
