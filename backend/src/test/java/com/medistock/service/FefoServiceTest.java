package com.medistock.service;

import com.medistock.dto.request.FefoOverrideRequest;
import com.medistock.entity.FefoOverride;
import com.medistock.entity.Medicine;
import com.medistock.entity.User;
import com.medistock.enums.Role;
import com.medistock.enums.UserStatus;
import com.medistock.repository.FefoOverrideRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.impl.FefoServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FefoServiceTest {

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private FefoOverrideRepository fefoOverrideRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogService auditLogService;

    private FefoServiceImpl fefoService;

    @BeforeEach
    void setUp() {
        fefoService = new FefoServiceImpl(medicineRepository, fefoOverrideRepository, userRepository, auditLogService);
    }

    @Test
    @DisplayName("Should detect non-compliant batch and recommend earlier expiring stock")
    void testValidateFefoDetectsEarlierBatch() {
        Medicine requestedBatch = new Medicine();
        requestedBatch.setId(2L);
        requestedBatch.setName("Insulin Glargine");
        requestedBatch.setGenericName("Insulin Glargine");
        requestedBatch.setBatchNumber("BATCH-LATE");
        requestedBatch.setQuantity(20);
        requestedBatch.setExpiryDate(LocalDate.now().plusMonths(6));

        Medicine earlierBatch = new Medicine();
        earlierBatch.setId(1L);
        earlierBatch.setName("Insulin Glargine");
        earlierBatch.setGenericName("Insulin Glargine");
        earlierBatch.setBatchNumber("BATCH-EARLY");
        earlierBatch.setQuantity(15);
        earlierBatch.setExpiryDate(LocalDate.now().plusMonths(2));

        when(medicineRepository.findById(2L)).thenReturn(Optional.of(requestedBatch));
        when(medicineRepository.findAll()).thenReturn(List.of(earlierBatch, requestedBatch));

        Map<String, Object> result = fefoService.validateFefoIssuing(2L, 5);

        assertFalse((Boolean) result.get("fefoCompliant"));
        assertEquals(1L, result.get("recommendedMedicineId"));
        assertEquals("BATCH-EARLY", result.get("recommendedBatch"));
        assertTrue(((String) result.get("warning")).contains("FEFO Warning"));
    }

    @Test
    @DisplayName("Should successfully record clinical FEFO override with audit log")
    void testRecordFefoOverride() {
        Medicine requested = new Medicine();
        requested.setId(2L);
        requested.setBatchNumber("BATCH-LATE");
        requested.setExpiryDate(LocalDate.now().plusMonths(6));

        Medicine recommended = new Medicine();
        recommended.setId(1L);
        recommended.setBatchNumber("BATCH-EARLY");
        recommended.setExpiryDate(LocalDate.now().plusMonths(2));

        User user = new User("pharm@medistock.com", "pass", "Dr. Pharmacist", "123", "Main", Role.PHARMACIST, UserStatus.ACTIVE);

        FefoOverrideRequest request = new FefoOverrideRequest();
        request.setRequestedMedicineId(2L);
        request.setRecommendedMedicineId(1L);
        request.setQuantity(10);
        request.setOverrideReason("Prescription requires specific formulation batch");

        when(medicineRepository.findById(2L)).thenReturn(Optional.of(requested));
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(recommended));
        when(userRepository.findByEmail("pharm@medistock.com")).thenReturn(Optional.of(user));
        when(fefoOverrideRepository.save(any(FefoOverride.class))).thenAnswer(i -> {
            FefoOverride o = i.getArgument(0);
            o.setId(10L);
            return o;
        });

        FefoOverride override = fefoService.recordOverride(request, "pharm@medistock.com");

        assertNotNull(override);
        assertEquals("Prescription requires specific formulation batch", override.getOverrideReason());
        verify(fefoOverrideRepository, times(1)).save(any(FefoOverride.class));
        verify(auditLogService, times(1)).log(eq("pharm@medistock.com"), eq("PHARMACIST"), eq("FEFO_OVERRIDE"), eq("FefoOverride"), any(), any());
    }
}
