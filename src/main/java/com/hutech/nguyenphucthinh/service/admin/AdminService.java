package com.hutech.nguyenphucthinh.service.admin;

import com.hutech.nguyenphucthinh.model.Booking;
import com.hutech.nguyenphucthinh.model.Companion;
import com.hutech.nguyenphucthinh.model.Report;
import com.hutech.nguyenphucthinh.model.Review;
import com.hutech.nguyenphucthinh.model.Transaction;
import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.repository.CompanionRepository;
import com.hutech.nguyenphucthinh.repository.TransactionRepository;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminService {
    @Autowired
    private CompanionRepository companionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @PersistenceContext
    private EntityManager entityManager;

    private volatile BigDecimal commissionRate = new BigDecimal("0.15");
    private final Map<Long, String> userFlags = new ConcurrentHashMap<>();
    private final Set<Long> hiddenReviewIds = ConcurrentHashMap.newKeySet();
    private final Map<Long, String> disputeActions = new ConcurrentHashMap<>();

    public List<Companion> getPendingCompanions() {
        return companionRepository.findByStatus(Companion.Status.PENDING);
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

    public Map<String, Object> getUsersData() {
        List<Map<String, Object>> users = new ArrayList<>();
        for (User user : userRepository.findAll()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", user.getId());
            item.put("username", user.getUsername());
            item.put("email", user.getEmail());
            item.put("role", user.getRole());
            item.put("fullName", user.getFullName());
            item.put("flag", userFlags.getOrDefault(user.getId(), "NONE"));
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
            item.put("flag", companion.getUser() == null ? "NONE" : userFlags.getOrDefault(companion.getUser().getId(), "NONE"));
            companions.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("users", users);
        response.put("companions", companions);
        return response;
    }

    public Map<String, Object> warnUser(Long userId) {
        userRepository.findById(userId).orElseThrow();
        userFlags.put(userId, "WARNED");
        return Map.of("message", "Da canh cao nguoi dung", "userId", userId, "flag", "WARNED");
    }

    public Map<String, Object> banUser(Long userId) {
        userRepository.findById(userId).orElseThrow();
        userFlags.put(userId, "BANNED");
        return Map.of("message", "Da khoa tai khoan", "userId", userId, "flag", "BANNED");
    }

    public Map<String, Object> resetUserStatus(Long userId) {
        userRepository.findById(userId).orElseThrow();
        userFlags.remove(userId);
        return Map.of("message", "Da khoi phuc trang thai binh thuong", "userId", userId, "flag", "NONE");
    }

    public List<Map<String, Object>> getReviewsForModeration() {
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
        return response;
    }

    public Map<String, Object> hideReview(Long reviewId) {
        Review review = entityManager.find(Review.class, reviewId);
        if (review == null) {
            throw new RuntimeException("Review not found");
        }
        hiddenReviewIds.add(reviewId);
        return Map.of("message", "Da an danh gia vi pham", "reviewId", reviewId, "hidden", true);
    }

    public Map<String, Object> getTransactionManagementData() {
        List<Map<String, Object>> withdrawals = new ArrayList<>();
        for (Transaction transaction : transactionRepository.findAll()) {
            if (transaction.getStatus() == Transaction.Status.PENDING) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", transaction.getId());
                item.put("amount", transaction.getAmount());
                item.put("createdAt", transaction.getCreatedAt());
                item.put("status", transaction.getStatus());
                item.put("bookingId", transaction.getBooking() == null ? null : transaction.getBooking().getId());
                item.put(
                        "companionName",
                        transaction.getBooking() != null
                                && transaction.getBooking().getCompanion() != null
                                && transaction.getBooking().getCompanion().getUser() != null
                                ? transaction.getBooking().getCompanion().getUser().getUsername()
                                : "Unknown"
                );
                withdrawals.add(item);
            }
        }
        withdrawals.sort(Comparator.comparing(item -> String.valueOf(item.get("createdAt")), Comparator.reverseOrder()));
        return Map.of("commissionRate", commissionRate, "pendingWithdrawals", withdrawals);
    }

    public Map<String, Object> updateCommissionRate(BigDecimal rate) {
        if (rate == null || rate.compareTo(BigDecimal.ZERO) < 0 || rate.compareTo(BigDecimal.ONE) > 0) {
            throw new RuntimeException("Commission rate must be between 0 and 1");
        }
        commissionRate = rate.setScale(4, RoundingMode.HALF_UP);
        return Map.of("message", "Da cap nhat commission rate", "commissionRate", commissionRate);
    }

    public Map<String, Object> approveWithdrawal(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId).orElseThrow();
        transaction.setStatus(Transaction.Status.COMPLETED);
        transactionRepository.save(transaction);
        return Map.of("message", "Da duyet lenh rut tien", "transactionId", transactionId, "status", transaction.getStatus());
    }

    public Map<String, Object> rejectWithdrawal(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId).orElseThrow();
        transaction.setStatus(Transaction.Status.FAILED);
        transactionRepository.save(transaction);
        return Map.of("message", "Da tu choi lenh rut tien", "transactionId", transactionId, "status", transaction.getStatus());
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
        return Map.of("message", "Da dong bang tien coc", "reportId", reportId, "action", "ESCROW_FROZEN");
    }

    public Map<String, Object> refundToUser(Long reportId) {
        Report report = validateReportExists(reportId);
        report.setStatus(Report.Status.RESOLVED);
        entityManager.merge(report);
        disputeActions.put(reportId, "REFUND_TO_USER");
        return Map.of("message", "Da hoan tien cho User", "reportId", reportId, "action", "REFUND_TO_USER");
    }

    public Map<String, Object> payoutToCompanion(Long reportId) {
        Report report = validateReportExists(reportId);
        report.setStatus(Report.Status.RESOLVED);
        entityManager.merge(report);
        disputeActions.put(reportId, "PAYOUT_TO_COMPANION");
        return Map.of("message", "Da tra tien cho Companion", "reportId", reportId, "action", "PAYOUT_TO_COMPANION");
    }

    public Map<String, Object> closeDispute(Long reportId) {
        Report report = validateReportExists(reportId);
        report.setStatus(Report.Status.RESOLVED);
        entityManager.merge(report);
        disputeActions.put(reportId, "CLOSED");
        return Map.of("message", "Da dong tranh chap", "reportId", reportId, "action", "CLOSED");
    }

    private Report validateReportExists(Long reportId) {
        Report report = entityManager.find(Report.class, reportId);
        if (report == null) {
            throw new RuntimeException("Report not found");
        }
        return report;
    }
}
