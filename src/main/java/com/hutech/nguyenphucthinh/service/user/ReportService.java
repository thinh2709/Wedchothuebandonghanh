package com.hutech.nguyenphucthinh.service.user;

import com.hutech.nguyenphucthinh.model.Report;
import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.repository.ReportRepository;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReportService {
    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private UserRepository userRepository;

    public Report createReport(Long reporterId, Long reportedUserId, String reason, String category, Boolean emergency) {
        if (reason == null || reason.isBlank()) {
            throw new RuntimeException("Reason is required");
        }

        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new RuntimeException("Reporter not found"));
        User reportedUser = userRepository.findById(reportedUserId)
                .orElseThrow(() -> new RuntimeException("Reported user not found"));

        if (reporter.getId().equals(reportedUser.getId())) {
            throw new RuntimeException("Cannot report yourself");
        }

        Report report = new Report();
        report.setReporter(reporter);
        report.setReportedUser(reportedUser);
        report.setReason(reason.trim());
        report.setCategory(category == null ? "OTHER" : category);
        report.setEmergency(Boolean.TRUE.equals(emergency));
        report.setStatus(Report.Status.PENDING);
        return reportRepository.save(report);
    }

    public List<Report> getMyReports(Long reporterId) {
        return reportRepository.findByReporterIdOrderByCreatedAtDesc(reporterId);
    }
}
