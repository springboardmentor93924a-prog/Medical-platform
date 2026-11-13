package com.medistock.backend.repository;

import com.medistock.backend.entity.StockCount;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockCountRepository extends JpaRepository<StockCount, Long> {
    List<StockCount> findAllByOrderByCountedAtDescIdDesc(Pageable pageable);
    List<StockCount> findByCountedByIdOrderByCountedAtDescIdDesc(Long userId, Pageable pageable);
}
