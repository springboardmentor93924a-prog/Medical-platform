package com.medistock.backend.controller;

import com.medistock.backend.dto.OrderDtos.*;
import com.medistock.backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService service;

    public OrderController(OrderService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','SUPPLIER')")
    public List<OrderResponse> list(Authentication auth) { return service.list(auth.getName()); }

    // Only the Pharmacist places orders. The Admin approves or rejects them.
    @PostMapping
    @PreAuthorize("hasRole('PHARMACIST')")
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody OrderRequest r, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(r, auth.getName()));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public OrderResponse approve(@PathVariable Long id, Authentication auth) { return service.approve(id, auth.getName()); }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public OrderResponse reject(@PathVariable Long id, @Valid @RequestBody RejectRequest r, Authentication auth) {
        return service.reject(id, r.reason(), auth.getName());
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('SUPPLIER')")
    public OrderResponse accept(@PathVariable Long id, Authentication auth) { return service.accept(id, auth.getName()); }

    @PostMapping("/{id}/dispatch")
    @PreAuthorize("hasRole('SUPPLIER')")
    public OrderResponse dispatch(@PathVariable Long id, Authentication auth) { return service.dispatch(id, auth.getName()); }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('PHARMACIST')")
    public OrderResponse cancel(@PathVariable Long id) { return service.cancel(id); }
}
