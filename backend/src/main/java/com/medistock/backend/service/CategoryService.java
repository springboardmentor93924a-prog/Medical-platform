package com.medistock.backend.service;

import com.medistock.backend.dto.CategoryDtos.*;
import com.medistock.backend.entity.Category;
import com.medistock.backend.entity.Medicine;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.CategoryRepository;
import com.medistock.backend.repository.MedicineRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CategoryService {
    private final CategoryRepository repo;
    private final MedicineRepository medicines;

    public CategoryService(CategoryRepository repo, MedicineRepository medicines) {
        this.repo = repo;
        this.medicines = medicines;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list() {
        Map<Long, Long> counts = medicines.findAll().stream().filter(Medicine::isActive)
            .collect(Collectors.groupingBy(m -> m.getCategory().getId(), Collectors.counting()));
        return repo.findAll(Sort.by("name")).stream()
            .map(c -> toDto(c, counts.getOrDefault(c.getId(), 0L))).toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest r) {
        if (repo.existsByNameIgnoreCase(r.name().trim())) throw duplicate();
        Category c = new Category();
        apply(c, r);
        return toDto(repo.save(c), 0);
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest r) {
        Category c = find(id);
        String name = r.name().trim();
        if (!c.getName().equalsIgnoreCase(name) && repo.existsByNameIgnoreCase(name)) throw duplicate();
        apply(c, r);
        return toDto(c, countFor(id));
    }

    @Transactional
    public void delete(Long id) {
        Category c = find(id);
        long used = countFor(id);
        if (used > 0)
            throw new ApiException(HttpStatus.CONFLICT, "This category is used by " + used + " medicine"
                + (used == 1 ? "" : "s") + " and cannot be deleted");
        if (medicines.existsByCategoryId(id))
            throw new ApiException(HttpStatus.CONFLICT,
                "Only deleted medicines still use this category, so it cannot be removed yet");
        repo.delete(c);
    }

    private long countFor(Long categoryId) {
        return medicines.findAll().stream().filter(m -> m.isActive() && m.getCategory().getId().equals(categoryId)).count();
    }

    private Category find(Long id) {
        return repo.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category not found"));
    }

    private static ApiException duplicate() {
        return new ApiException(HttpStatus.CONFLICT, "A category with this name already exists", "name");
    }

    private static void apply(Category c, CategoryRequest r) {
        c.setName(r.name().trim());
        c.setDescription(r.description() == null || r.description().isBlank() ? null : r.description().trim());
    }

    private static CategoryResponse toDto(Category c, long count) {
        return new CategoryResponse(c.getId(), c.getName(), c.getDescription(), count);
    }
}
