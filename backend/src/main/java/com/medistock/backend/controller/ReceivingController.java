package com.medistock.backend.controller;

import com.medistock.backend.dto.OrderDtos.OrderResponse;
import com.medistock.backend.dto.ReceiveDtos.ReceiveRequest;
import com.medistock.backend.service.ReceivingService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class ReceivingController {
    private final ReceivingService service;

    public ReceivingController(ReceivingService service) { this.service = service; }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasRole('PHARMACIST')")
    public OrderResponse receive(@PathVariable Long id, @Valid @RequestBody ReceiveRequest r, Authentication auth) {
        return service.receive(id, r, auth.getName());
    }
}
