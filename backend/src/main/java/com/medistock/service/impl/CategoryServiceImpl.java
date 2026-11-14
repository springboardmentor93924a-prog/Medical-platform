package com.medistock.service.impl;

import com.medistock.dto.request.CategoryRequest;
import com.medistock.entity.Category;
import com.medistock.exception.BadRequestException;
import com.medistock.exception.DuplicateResourceException;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.CategoryRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.service.AuditLogService;
import com.medistock.service.CategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final MedicineRepository medicineRepository;
    private final AuditLogService auditLogService;

    public CategoryServiceImpl(CategoryRepository categoryRepository, MedicineRepository medicineRepository, AuditLogService auditLogService) {
        this.categoryRepository = categoryRepository;
        this.medicineRepository = medicineRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Override
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    @Override
    @Transactional
    public Category createCategory(CategoryRequest request, String userEmail) {
        if (categoryRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new DuplicateResourceException("Category with name '" + request.getName() + "' already exists.");
        }

        Category category = new Category(request.getName().trim(), request.getDescription());
        Category saved = categoryRepository.save(category);

        auditLogService.log(userEmail, "AUTH", "CREATE_CATEGORY", "Category", saved.getId().toString(), "Created category " + saved.getName());
        return saved;
    }

    @Override
    @Transactional
    public Category updateCategory(Long id, CategoryRequest request, String userEmail) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        if (!category.getName().equalsIgnoreCase(request.getName().trim()) &&
                categoryRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new DuplicateResourceException("Category with name '" + request.getName() + "' already exists.");
        }

        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        Category updated = categoryRepository.save(category);

        auditLogService.log(userEmail, "AUTH", "UPDATE_CATEGORY", "Category", updated.getId().toString(), "Updated category " + updated.getName());
        return updated;
    }

    @Override
    @Transactional
    public void deleteCategory(Long id, String userEmail) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        if (medicineRepository.existsByCategory_Id(id)) {
            throw new BadRequestException("Cannot delete category '" + category.getName() + "' because it is currently linked to one or more active medicines. Please reassign or delete the associated medicines first.");
        }

        categoryRepository.delete(category);
        auditLogService.log(userEmail, "AUTH", "DELETE_CATEGORY", "Category", id.toString(), "Deleted category " + category.getName());
    }
}
