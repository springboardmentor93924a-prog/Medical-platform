package com.medistock.backend.service;

import com.medistock.backend.dto.SupplierDtos.*;
import com.medistock.backend.entity.Supplier;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.SupplierRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class SupplierService {
    private final SupplierRepository repo;

    public SupplierService(SupplierRepository repo) { this.repo = repo; }

    public List<SupplierResponse> list() {
        return repo.findAll(Sort.by("name")).stream().map(SupplierService::toDto).toList();
    }

    public SupplierResponse get(Long id) { return toDto(find(id)); }

    @Transactional
    public SupplierResponse create(SupplierRequest r) {
        if (repo.existsByNameIgnoreCase(r.name().trim())) throw duplicate();
        Supplier s = new Supplier();
        apply(s, r);
        s.setActive(r.active() == null || r.active());
        return toDto(repo.save(s));
    }

    @Transactional
    public SupplierResponse update(Long id, SupplierRequest r) {
        Supplier s = find(id);
        String name = r.name().trim();
        if (!s.getName().equalsIgnoreCase(name) && repo.existsByNameIgnoreCase(name)) throw duplicate();
        apply(s, r);
        if (r.active() != null) s.setActive(r.active());
        return toDto(s);   // changes are saved when the transaction ends
    }

    private Supplier find(Long id) {
        return repo.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Supplier not found"));
    }

    private static ApiException duplicate() {
        return new ApiException(HttpStatus.CONFLICT, "A supplier with this name already exists", "name");
    }

    private static void apply(Supplier s, SupplierRequest r) {
        s.setName(r.name().trim());
        s.setPhone(r.phone().trim());
        s.setEmail(r.email().trim().toLowerCase());
        s.setAddress(r.address().trim());
    }

    private static SupplierResponse toDto(Supplier s) {
        return new SupplierResponse(s.getId(), s.getName(), s.getPhone(), s.getEmail(), s.getAddress(), s.isActive());
    }
}
