package com.medistock.medistock.ai.repository;

import com.medistock.medistock.ai.entity.ForecastResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ForecastResultRepository extends JpaRepository<ForecastResult, Integer> {

    List<ForecastResult> findByMedicineIdOrderByForecastDateDesc(Integer medicineId);

    List<ForecastResult> findByMedicineIdAndForecastHorizonOrderByForecastDateDesc(Integer medicineId, Integer horizon);

    Optional<ForecastResult> findTopByMedicineIdAndForecastHorizonOrderByCreatedAtDesc(Integer medicineId, Integer horizon);

    List<ForecastResult> findByForecastDate(LocalDate forecastDate);
}
