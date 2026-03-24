package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.model.Report;
import com.hutech.nguyenphucthinh.service.user.ReportService;
import com.hutech.nguyenphucthinh.util.RequestBodyParseUtil;
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
        String reason = request.get("reason") == null ? null : String.valueOf(request.get("reason"));
        String category = request.get("category") == null ? "OTHER" : String.valueOf(request.get("category"));
        boolean emergency = false;
        Object em = request.get("emergency");
        if (em instanceof Boolean b) {
            emergency = b;
        } else if (em instanceof String s) {
            emergency = Boolean.parseBoolean(s);
        }
        if (reportedUserId == null) {
            throw new RuntimeException("reportedUserId is required");
        }

        Long relatedBookingId = null;
        Object bid = request.get("bookingId");
        if (bid instanceof Number n) {
            relatedBookingId = n.longValue();
        } else if (bid instanceof String s && !s.isBlank()) {
            try {
                relatedBookingId = Long.valueOf(s.trim());
            } catch (NumberFormatException ignored) {
                relatedBookingId = null;
            }
        }

        Double reporterLat = RequestBodyParseUtil.readDouble(request, "reporterLatitude");
        Double reporterLng = RequestBodyParseUtil.readDouble(request, "reporterLongitude");

        return reportService.createReport(userId, reportedUserId.longValue(), reason, category, emergency,
                relatedBookingId, reporterLat, reporterLng);
    }
}
