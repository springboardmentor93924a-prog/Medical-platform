
package com.medistock.controller;

import com.medistock.dto.MedicineReturnDecisionRequest;
import com.medistock.dto.MedicineReturnRequest;
import com.medistock.entity.MedicineReturn;
import com.medistock.service.MedicineReturnService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/returns")
public class MedicineReturnController {

    private final MedicineReturnService medicineReturnService;

    public MedicineReturnController(
            MedicineReturnService medicineReturnService) {
        this.medicineReturnService = medicineReturnService;
    }

    // Create a customer or supplier return.
    @PostMapping
    public ResponseEntity<MedicineReturn> createReturn(
            @Valid @RequestBody MedicineReturnRequest request) {

        MedicineReturn result =
                medicineReturnService.createReturn(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // Get all return records.
    @GetMapping
    public ResponseEntity<List<MedicineReturn>> getAllReturns() {

        return ResponseEntity.ok(
                medicineReturnService.getAllReturns());
    }

    // Approve or reject a return.
    @PutMapping("/{returnId}/decision")
    public ResponseEntity<MedicineReturn> processReturn(
            @PathVariable Long returnId,
            @Valid @RequestBody MedicineReturnDecisionRequest request) {

        MedicineReturn result =
                medicineReturnService.processReturn(returnId, request);

        return ResponseEntity.ok(result);
    }
}
