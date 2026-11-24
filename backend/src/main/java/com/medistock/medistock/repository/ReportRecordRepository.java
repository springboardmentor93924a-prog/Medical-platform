package com.medistock.medistock.repository;

import com.medistock.medistock.entity.ReportRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRecordRepository extends JpaRepository<ReportRecord, Integer> {
    List<ReportRecord> findAllByOrderByGeneratedAtDesc();
    List<ReportRecord> findByReportTypeOrderByGeneratedAtDesc(String reportType);
}
