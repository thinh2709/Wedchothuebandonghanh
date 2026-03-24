package com.hutech.nguyenphucthinh.repository;

import com.hutech.nguyenphucthinh.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByReporterIdOrderByCreatedAtDesc(Long reporterId);
}
