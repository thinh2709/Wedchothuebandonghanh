package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.model.Report;
import com.hutech.nguyenphucthinh.service.user.ReportService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    @Autowired
    private ReportService reportService;

    @GetMapping("/me")
    public List<Report> getMyReports(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return reportService.getMyReports(userId);
    }

    @PostMapping
    public Report createReport(@RequestBody Map<String, Object> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }

        Number reportedUserId = (Number) request.get("reportedUserId");
        String reason = (String) request.get("reason");
        String category = (String) request.getOrDefault("category", "OTHER");
        Boolean emergency = (Boolean) request.getOrDefault("emergency", false);
        if (reportedUserId == null) {
            throw new RuntimeException("reportedUserId is required");
        }

        return reportService.createReport(userId, reportedUserId.longValue(), reason, category, emergency);
    }
}
