package com.hutech.nguyenphucthinh.controller.admin;

import com.hutech.nguyenphucthinh.model.Companion;
import com.hutech.nguyenphucthinh.service.admin.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired
    private AdminService adminService;

    @GetMapping("/pending-companions")
    public List<Companion> getPendingCompanions() {
        return adminService.getPendingCompanions();
    }

    @PostMapping("/approve-companion/{id}")
    public Companion approveCompanion(@PathVariable Long id) {
        return adminService.approveCompanion(id);
    }

    @PostMapping("/reject-companion/{id}")
    public Companion rejectCompanion(@PathVariable Long id) {
        return adminService.rejectCompanion(id);
    }

    @GetMapping("/dashboard-stats")
    public Map<String, Object> getDashboardStats() {
        return adminService.getDashboardStats();
    }

    @GetMapping("/users")
    public Map<String, Object> getUsersData() {
        return adminService.getUsersData();
    }

    @PostMapping("/users/{id}/warn")
    public Map<String, Object> warnUser(@PathVariable Long id) {
        return adminService.warnUser(id);
    }

    @PostMapping("/users/{id}/ban")
    public Map<String, Object> banUser(@PathVariable Long id) {
        return adminService.banUser(id);
    }

    @GetMapping("/moderation/reviews")
    public List<Map<String, Object>> getReviewsForModeration() {
        return adminService.getReviewsForModeration();
    }

    @PostMapping("/moderation/reviews/{id}/hide")
    public Map<String, Object> hideReview(@PathVariable Long id) {
        return adminService.hideReview(id);
    }

    @GetMapping("/transactions")
    public Map<String, Object> getTransactionManagementData() {
        return adminService.getTransactionManagementData();
    }

    @PutMapping("/transactions/commission-rate")
    public Map<String, Object> updateCommissionRate(@RequestBody Map<String, BigDecimal> request) {
        return adminService.updateCommissionRate(request.get("commissionRate"));
    }

    @PostMapping("/transactions/withdrawals/{id}/approve")
    public Map<String, Object> approveWithdrawal(@PathVariable Long id) {
        return adminService.approveWithdrawal(id);
    }

    @PostMapping("/transactions/withdrawals/{id}/reject")
    public Map<String, Object> rejectWithdrawal(@PathVariable Long id) {
        return adminService.rejectWithdrawal(id);
    }

    @GetMapping("/disputes")
    public List<Map<String, Object>> getDisputes() {
        return adminService.getDisputes();
    }

    @PostMapping("/disputes/{id}/freeze-escrow")
    public Map<String, Object> freezeEscrow(@PathVariable Long id) {
        return adminService.freezeEscrow(id);
    }

    @PostMapping("/disputes/{id}/refund")
    public Map<String, Object> refundToUser(@PathVariable Long id) {
        return adminService.refundToUser(id);
    }

    @PostMapping("/disputes/{id}/payout")
    public Map<String, Object> payoutToCompanion(@PathVariable Long id) {
        return adminService.payoutToCompanion(id);
    }

    @PostMapping("/disputes/{id}/close")
    public Map<String, Object> closeDispute(@PathVariable Long id) {
        return adminService.closeDispute(id);
    }
}
