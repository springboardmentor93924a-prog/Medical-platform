package com.medistock.repository;

import com.medistock.entity.Category;
import com.medistock.entity.Medicine;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional // every test is rolled back, so your real data stays clean
class RepositoryTests {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Test
    void seededRolesExist() {
        assertThat(roleRepository.findByName("ADMIN")).isPresent();
        assertThat(roleRepository.findByName("PHARMACIST")).isPresent();
        assertThat(roleRepository.findByName("STAFF")).isPresent();
    }

    @Test
    void seededCategoriesExist() {
        assertThat(categoryRepository.findByName("Antibiotics")).isPresent();
        assertThat(categoryRepository.existsByName("Painkillers")).isTrue();
    }

    @Test
    void canSaveAndFindMedicine() {
        Category category = categoryRepository.findByName("Antibiotics").orElseThrow();

        Medicine medicine = new Medicine();
        medicine.setName("Amoxicillin 500mg");
        medicine.setManufacturer("Test Pharma");
        medicine.setCategory(category);

        Medicine saved = medicineRepository.saveAndFlush(medicine);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(medicineRepository.findByNameContainingIgnoreCase("amoxi")).isNotEmpty();
    }
}