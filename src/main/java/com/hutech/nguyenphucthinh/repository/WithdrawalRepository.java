package com.hutech.nguyenphucthinh.repository;

import com.hutech.nguyenphucthinh.model.Withdrawal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface WithdrawalRepository extends JpaRepository<Withdrawal, Long> {
    List<Withdrawal> findByCompanionIdOrderByCreatedAtDesc(Long companionId);
    List<Withdrawal> findByStatusOrderByCreatedAtDesc(Withdrawal.Status status);

    @Query("select coalesce(sum(w.amount), 0) from Withdrawal w where w.companion.id = :companionId and w.status in (com.hutech.nguyenphucthinh.model.Withdrawal.Status.PENDING, com.hutech.nguyenphucthinh.model.Withdrawal.Status.APPROVED)")
    BigDecimal sumLockedAmountByCompanionId(Long companionId);
}
