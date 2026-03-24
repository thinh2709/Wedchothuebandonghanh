package com.hutech.nguyenphucthinh.service.admin;

import com.hutech.nguyenphucthinh.model.Booking;
import com.hutech.nguyenphucthinh.model.Companion;
import com.hutech.nguyenphucthinh.model.Report;
import com.hutech.nguyenphucthinh.model.Review;
import com.hutech.nguyenphucthinh.model.Transaction;
import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.model.Withdrawal;
import com.hutech.nguyenphucthinh.repository.CompanionRepository;
import com.hutech.nguyenphucthinh.repository.TransactionRepository;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import com.hutech.nguyenphucthinh.repository.WithdrawalRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

@Service
public class AdminService {
    @Autowired
    private CompanionRepository companionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private WithdrawalRepository withdrawalRepository;
    @PersistenceContext
    private EntityManager entityManager;

    private volatile BigDecimal commissionRate = new BigDecimal("0.15");
    private final Set<Long> hiddenReviewIds = ConcurrentHashMap.newKeySet();
    private final Map<Long, String> disputeActions = new ConcurrentHashMap<>();

    public List<Companion> getPendingCompanions(String keyword) {
        List<Companion> list = companionRepository.findByStatus(Companion.Status.PENDING);
        if (isBlankKeyword(keyword)) {
            return list;
        }
        String k = normalizeKeyword(keyword);
        return list.stream().filter((c) -> pendingCompanionMatchesKeyword(c, k)).toList();
    }

    public Companion approveCompanion(Long id) {
        Companion companion = companionRepository.findById(id).orElseThrow();
        companion.setStatus(Companion.Status.APPROVED);
        return companionRepository.save(companion);
    }

    public Companion rejectCompanion(Long id) {
        Companion companion = companionRepository.findById(id).orElseThrow();
        companion.setStatus(Companion.Status.REJECTED);
        return companionRepository.save(companion);
    }

    public Map<String, Object> getDashboardStats() {
        long totalTransactions = transactionRepository.count();
        long cancelledBookings = entityManager.createQuery(
                        "select count(b) from Booking b where b.status = :status",
                        Long.class
                )
                .setParameter("status", Booking.Status.REJECTED)
                .getSingleResult();
        BigDecimal completedRevenue = entityManager.createQuery(
                        "select coalesce(sum(t.amount), 0) from Transaction t where t.status = :status",
                        BigDecimal.class
                )
                .setParameter("status", Transaction.Status.COMPLETED)
                .getSingleResult();
        BigDecimal platformProfit = completedRevenue.multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);

        Map<String, Object> stats = new HashMap<>();
        stats.put("platformProfit", platformProfit);
        stats.put("totalTransactions", totalTransactions);
        stats.put("cancelledBookings", cancelledBookings);
        stats.put("commissionRate", commissionRate);
        return stats;
    }

    public Map<String, Object> getUsersData(String keyword) {
        List<Map<String, Object>> users = new ArrayList<>();
        for (User user : userRepository.findAll()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", user.getId());
            item.put("username", user.getUsername());
            item.put("email", user.getEmail());
            item.put("role", user.getRole());
            item.put("fullName", user.getFullName());
            item.put("flag", user.getModerationFlag() == null ? "NONE" : user.getModerationFlag().name());
            users.add(item);
        }

        List<Map<String, Object>> companions = new ArrayList<>();
        for (Companion companion : companionRepository.findAll()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", companion.getId());
            item.put("userId", companion.getUser() != null ? companion.getUser().getId() : null);
            item.put("username", companion.getUser() != null ? companion.getUser().getUsername() : "");
            item.put("status", companion.getStatus());
            item.put("bio", companion.getBio());
            item.put(
                    "flag",
                    companion.getUser() == null || companion.getUser().getModerationFlag() == null
                            ? "NONE"
                            : companion.getUser().getModerationFlag().name()
            );
            companions.add(item);
        }

        if (!isBlankKeyword(keyword)) {
            String k = normalizeKeyword(keyword);
            users = users.stream().filter((row) -> adminUserRowMatches(row, k)).toList();
            companions = companions.stream().filter((row) -> adminCompanionRowMatches(row, k)).toList();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("users", users);
        response.put("companions", companions);
        return response;
    }

    public Map<String, Object> warnUser(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setModerationFlag(User.ModerationFlag.WARNED);
        userRepository.save(user);
        return Map.of("message", "Đã cảnh cáo người dùng", "userId", userId, "flag", "WARNED");
    }

    public Map<String, Object> banUser(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setModerationFlag(User.ModerationFlag.BANNED);
        user.setLocked(true);
        userRepository.save(user);
        return Map.of("message", "Đã khóa tài khoản", "userId", userId, "flag", "BANNED");
    }

    public Map<String, Object> resetUserStatus(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setModerationFlag(User.ModerationFlag.NONE);
        user.setLocked(false);
        userRepository.save(user);
        return Map.of("message", "Đã khôi phục trạng thái bình thường", "userId", userId, "flag", "NONE");
    }

    public List<Map<String, Object>> getReviewsForModeration(String keyword) {
        List<Review> reviews = entityManager.createQuery(
                        "select r from Review r order by r.createdAt desc",
                        Review.class
                )
                .getResultList();
        List<Map<String, Object>> response = new ArrayList<>();
        for (Review review : reviews) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", review.getId());
            item.put("rating", review.getRating());
            item.put("comment", review.getComment());
            item.put("createdAt", review.getCreatedAt());
            item.put("hidden", hiddenReviewIds.contains(review.getId()));
            item.put("bookingId", review.getBooking() == null ? null : review.getBooking().getId());
            response.add(item);
        }
        if (!isBlankKeyword(keyword)) {
            String k = normalizeKeyword(keyword);
            response = response.stream().filter((row) -> moderationReviewRowMatches(row, k)).toList();
        }
        return response;
    }

    public Map<String, Object> hideReview(Long reviewId) {
        Review review = entityManager.find(Review.class, reviewId);
        if (review == null) {
            throw new RuntimeException("Không tìm thấy đánh giá");
        }
        hiddenReviewIds.add(reviewId);
        return Map.of("message", "Đã ẩn đánh giá vi phạm", "reviewId", reviewId, "hidden", true);
    }

    public Map<String, Object> getTransactionManagementData(String keyword) {
        List<Map<String, Object>> withdrawals = new ArrayList<>();
        for (Withdrawal withdrawal : withdrawalRepository.findByStatusOrderByCreatedAtDesc(Withdrawal.Status.PENDING)) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", withdrawal.getId());
            item.put("amount", withdrawal.getAmount());
            item.put("createdAt", withdrawal.getCreatedAt());
            item.put("status", withdrawal.getStatus());
            item.put("bankName", withdrawal.getBankName());
            item.put("bankAccountNumber", withdrawal.getBankAccountNumber());
            item.put("accountHolderName", withdrawal.getAccountHolderName());
            item.put(
                    "companionName",
                    withdrawal.getCompanion() != null
                            && withdrawal.getCompanion().getUser() != null
                            ? withdrawal.getCompanion().getUser().getUsername()
                            : "Không xác định"
            );
            withdrawals.add(item);
        }
        if (!isBlankKeyword(keyword)) {
            String k = normalizeKeyword(keyword);
            withdrawals = withdrawals.stream().filter((row) -> withdrawalRowMatches(row, k)).toList();
        }
        return Map.of("commissionRate", commissionRate, "pendingWithdrawals", withdrawals);
    }

    public Map<String, Object> updateCommissionRate(BigDecimal rate) {
        if (rate == null || rate.compareTo(BigDecimal.ZERO) < 0 || rate.compareTo(BigDecimal.ONE) > 0) {
            throw new RuntimeException("Commission rate phải nằm trong khoảng 0 đến 1");
        }
        commissionRate = rate.setScale(4, RoundingMode.HALF_UP);
        return Map.of("message", "Đã cập nhật commission rate", "commissionRate", commissionRate);
    }

    public Map<String, Object> approveWithdrawal(Long withdrawalId) {
        Withdrawal withdrawal = withdrawalRepository.findById(withdrawalId).orElseThrow();
        if (withdrawal.getStatus() != Withdrawal.Status.PENDING) {
            throw new RuntimeException("Chỉ duyệt được lệnh rút tiền đang chờ");
        }
        withdrawal.setStatus(Withdrawal.Status.APPROVED);
        withdrawalRepository.save(withdrawal);
        return Map.of("message", "Đã duyệt lệnh rút tiền", "withdrawalId", withdrawalId, "status", withdrawal.getStatus());
    }

    public Map<String, Object> rejectWithdrawal(Long withdrawalId) {
        Withdrawal withdrawal = withdrawalRepository.findById(withdrawalId).orElseThrow();
        if (withdrawal.getStatus() != Withdrawal.Status.PENDING) {
            throw new RuntimeException("Chỉ từ chối được lệnh rút tiền đang chờ");
        }
        withdrawal.setStatus(Withdrawal.Status.REJECTED);
        withdrawalRepository.save(withdrawal);
        return Map.of("message", "Đã từ chối lệnh rút tiền", "withdrawalId", withdrawalId, "status", withdrawal.getStatus());
    }

    public List<Map<String, Object>> getDisputes() {
        List<Report> reports = entityManager.createQuery(
                        "select r from Report r order by r.createdAt desc",
                        Report.class
                )
                .getResultList();
        List<Map<String, Object>> response = new ArrayList<>();
        for (Report report : reports) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", report.getId());
            item.put("reporter", report.getReporter() == null ? "" : report.getReporter().getUsername());
            item.put("reportedUser", report.getReportedUser() == null ? "" : report.getReportedUser().getUsername());
            item.put("reason", report.getReason());
            item.put("status", report.getStatus());
            item.put("createdAt", report.getCreatedAt());
            item.put("lastAction", disputeActions.getOrDefault(report.getId(), "NONE"));
            response.add(item);
        }
        return response;
    }

    public Map<String, Object> freezeEscrow(Long reportId) {
        validateReportExists(reportId);
        disputeActions.put(reportId, "ESCROW_FROZEN");
        return Map.of("message", "Đã đóng băng tiền cọc", "reportId", reportId, "action", "ESCROW_FROZEN");
    }

    public Map<String, Object> refundToUser(Long reportId) {
        Report report = validateReportExists(reportId);
        report.setStatus(Report.Status.RESOLVED);
        entityManager.merge(report);
        disputeActions.put(reportId, "REFUND_TO_USER");
        return Map.of("message", "Đã hoàn tiền cho người dùng", "reportId", reportId, "action", "REFUND_TO_USER");
    }

    public Map<String, Object> payoutToCompanion(Long reportId) {
        Report report = validateReportExists(reportId);
        report.setStatus(Report.Status.RESOLVED);
        entityManager.merge(report);
        disputeActions.put(reportId, "PAYOUT_TO_COMPANION");
        return Map.of("message", "Đã trả tiền cho companion", "reportId", reportId, "action", "PAYOUT_TO_COMPANION");
    }

    public Map<String, Object> closeDispute(Long reportId) {
        Report report = validateReportExists(reportId);
        report.setStatus(Report.Status.RESOLVED);
        entityManager.merge(report);
        disputeActions.put(reportId, "CLOSED");
        return Map.of("message", "Đã đóng tranh chấp", "reportId", reportId, "action", "CLOSED");
    }

    private Report validateReportExists(Long reportId) {
        Report report = entityManager.find(Report.class, reportId);
        if (report == null) {
            throw new RuntimeException("Không tìm thấy tố cáo");
        }
        return report;
    }

    private static boolean isBlankKeyword(String keyword) {
        return keyword == null || keyword.trim().isEmpty();
    }

    private static String normalizeKeyword(String keyword) {
        return keyword.trim().toLowerCase();
    }

    private static boolean textContainsIgnoreCase(String text, String keywordLower) {
        return text != null && text.toLowerCase().contains(keywordLower);
    }

    private static boolean idOrNumberMatches(Object id, String keywordLower) {
        return String.valueOf(id).toLowerCase().contains(keywordLower);
    }

    private boolean pendingCompanionMatchesKeyword(Companion c, String k) {
        User u = c.getUser();
        return Stream.of(
                        u != null ? u.getUsername() : null,
                        u != null ? u.getEmail() : null,
                        u != null ? u.getFullName() : null,
                        c.getBio()
                )
                .anyMatch((t) -> textContainsIgnoreCase(t, k))
                || idOrNumberMatches(c.getId(), k);
    }

    private boolean adminUserRowMatches(Map<String, Object> row, String k) {
        return textContainsIgnoreCase(String.valueOf(row.getOrDefault("username", "")), k)
                || textContainsIgnoreCase(String.valueOf(row.getOrDefault("email", "")), k)
                || textContainsIgnoreCase(String.valueOf(row.getOrDefault("fullName", "")), k)
                || idOrNumberMatches(row.get("id"), k);
    }

    private boolean adminCompanionRowMatches(Map<String, Object> row, String k) {
        return textContainsIgnoreCase(String.valueOf(row.getOrDefault("username", "")), k)
                || textContainsIgnoreCase(String.valueOf(row.getOrDefault("bio", "")), k)
                || idOrNumberMatches(row.get("id"), k)
                || idOrNumberMatches(row.get("userId"), k);
    }

    private boolean moderationReviewRowMatches(Map<String, Object> row, String k) {
        if (idOrNumberMatches(row.get("id"), k)) {
            return true;
        }
        Object bookingId = row.get("bookingId");
        if (bookingId != null && String.valueOf(bookingId).toLowerCase().contains(k)) {
            return true;
        }
        return textContainsIgnoreCase(String.valueOf(row.getOrDefault("comment", "")), k)
                || String.valueOf(row.getOrDefault("rating", "")).toLowerCase().contains(k);
    }

    private boolean withdrawalRowMatches(Map<String, Object> row, String k) {
        return idOrNumberMatches(row.get("id"), k)
                || textContainsIgnoreCase(String.valueOf(row.getOrDefault("companionName", "")), k)
                || textContainsIgnoreCase(String.valueOf(row.getOrDefault("bankName", "")), k)
                || textContainsIgnoreCase(String.valueOf(row.getOrDefault("bankAccountNumber", "")), k)
                || textContainsIgnoreCase(String.valueOf(row.getOrDefault("accountHolderName", "")), k)
                || String.valueOf(row.getOrDefault("amount", "")).toLowerCase().contains(k)
                || String.valueOf(row.getOrDefault("status", "")).toLowerCase().contains(k);
    }
}
