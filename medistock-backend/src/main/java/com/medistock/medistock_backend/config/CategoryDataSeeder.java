package com.medistock.medistock_backend.config;

import com.medistock.medistock_backend.entity.Category;
import com.medistock.medistock_backend.entity.Medicine;
import com.medistock.medistock_backend.repository.CategoryRepository;
import com.medistock.medistock_backend.repository.MedicineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class CategoryDataSeeder implements CommandLineRunner {

    private final MedicineRepository medicineRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) throws Exception {
        List<Medicine> allMeds = medicineRepository.findAll();
        Set<String> existingCategories = new HashSet<>();

        // Load existing categories to prevent duplicates
        categoryRepository.findAll().forEach(c -> existingCategories.add(c.getName().toLowerCase()));

        int count = 0;
        for (Medicine med : allMeds) {
            String catName = med.getCategory();
            if (catName != null && !catName.trim().isEmpty() && !existingCategories.contains(catName.toLowerCase())) {
                Category newCat = new Category();
                newCat.setName(catName);
                newCat.setDescription("Auto-generated category for " + catName + " medications.");
                categoryRepository.save(newCat);
                existingCategories.add(catName.toLowerCase());
                count++;
            }
        }

        if (count > 0) {
            System.out.println(">>> SEEDED " + count + " CATEGORIES FROM EXISTING MEDICINES!");
        }
    }
}