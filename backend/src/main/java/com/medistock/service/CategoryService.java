package com.medistock.service;

import com.medistock.dto.request.CategoryRequest;
import com.medistock.entity.Category;

import java.util.List;

public interface CategoryService {
    List<Category> getAllCategories();
    Category getCategoryById(Long id);
    Category createCategory(CategoryRequest request, String userEmail);
    Category updateCategory(Long id, CategoryRequest request, String userEmail);
    void deleteCategory(Long id, String userEmail);
}
