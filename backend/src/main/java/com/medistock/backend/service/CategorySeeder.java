package com.medistock.backend.service;

import com.medistock.backend.entity.Category;
import com.medistock.backend.repository.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.List;

/** Adds the starter categories the first time the app runs on an empty table. */
@Component
public class CategorySeeder implements CommandLineRunner {
    private final CategoryRepository repo;

    public CategorySeeder(CategoryRepository repo) { this.repo = repo; }

    @Override
    public void run(String... args) {
        if (repo.count() > 0) return;
        for (String name : List.of("Antibiotic", "Analgesic", "Antacid", "Antidiabetic", "Cardiac", "Vitamin", "Antiallergic")) {
            Category c = new Category();
            c.setName(name);
            repo.save(c);
        }
    }
}
