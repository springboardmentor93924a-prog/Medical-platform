
package com.medistock.repository;

import com.medistock.entity.StockCheckReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockCheckReportRepository
        extends JpaRepository<StockCheckReport, Long> {

    List<StockCheckReport> findAllByOrderByReportedAtDesc();

    List<StockCheckReport> findByReportedByOrderByReportedAtDesc(
            Long reportedBy
    );
}
