package com.hutech.nguyenphucthinh.service.user;

import com.hutech.nguyenphucthinh.model.Report;
import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.repository.ReportRepository;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class ReportService {
    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private NotificationService notificationService;

    public Report createReport(Long reporterId, Long reportedUserId, String reason, String category, Boolean emergency,
                               Long relatedBookingId, Double reporterLatitude, Double reporterLongitude) {
        if (reason == null || reason.isBlank()) {
            throw new RuntimeException("Lý do tố cáo là bắt buộc");
        }

        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người tố cáo"));
        User reportedUser = userRepository.findById(reportedUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người bị tố cáo"));

        if (reporter.getId().equals(reportedUser.getId())) {
            throw new RuntimeException("Bạn không thể tự tố cáo chính mình");
        }

        Report report = new Report();
        report.setReporter(reporter);
        report.setReportedUser(reportedUser);
        report.setReason(reason.trim());
        report.setCategory(category == null ? "OTHER" : category);
        report.setEmergency(Boolean.TRUE.equals(emergency));
        report.setRelatedBookingId(relatedBookingId);
        report.setReporterLatitude(reporterLatitude);
        report.setReporterLongitude(reporterLongitude);
        report.setStatus(Report.Status.PENDING);
        Report saved = reportRepository.save(report);
        if (Boolean.TRUE.equals(saved.getEmergency())) {
            String adminBody = buildEmergencyAdminNotificationBody(
                    reporter, reportedUser, saved.getCategory(), reason.trim(),
                    relatedBookingId, reporterLatitude, reporterLongitude);
            userRepository.findByRole(User.Role.ADMIN).forEach(admin -> notificationService.create(
                    admin.getId(),
                    String.format(Locale.ROOT, "SOS khách · %s (#%d) → user #%d",
                            reporter.getUsername(), reporter.getId(), reportedUser.getId()),
                    adminBody
            ));
        }
        return saved;
    }

    private static String buildEmergencyAdminNotificationBody(User reporter, User reportedUser, String category,
                                                              String reason, Long bookingId,
                                                              Double lat, Double lng) {
        String reasonShort = reason.length() > 400 ? reason.substring(0, 400) + "…" : reason;
        StringBuilder b = new StringBuilder(640);
        b.append("Khách: ").append(reporter.getUsername()).append(" (#").append(reporter.getId()).append(")\n\n");
        b.append("Bị tố: user #").append(reportedUser.getId()).append("\n\n");
        b.append("Loại: ").append(category != null ? category : "OTHER").append("\n\n");
        if (bookingId != null) {
            b.append("Booking: #").append(bookingId).append("\n\n");
        }
        b.append("— Mô tả —\n");
        b.append(reasonShort).append("\n\n");
        if (lat != null && lng != null) {
            b.append("— Vị trí thiết bị lúc gửi (GPS) —\n");
            b.append(String.format(Locale.ROOT, "%.6f, %.6f\n", lat, lng));
            b.append("Google Maps: https://www.google.com/maps?q=").append(lat).append(",").append(lng);
        } else {
            b.append("— Vị trí GPS —\n");
            b.append("Chưa có tọa độ. Thường do: từ chối quyền định vị, site không HTTPS/localhost, hoặc tắt GPS trên máy.");
        }
        return b.toString();
    }

    public List<Report> getMyReports(Long reporterId) {
        return reportRepository.findByReporterIdOrderByCreatedAtDesc(reporterId);
    }
}
