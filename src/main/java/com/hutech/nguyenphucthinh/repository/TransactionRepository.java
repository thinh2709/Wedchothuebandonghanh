package com.hutech.nguyenphucthinh.repository;

import com.hutech.nguyenphucthinh.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    @Query("select coalesce(sum(t.amount), 0) from Transaction t where t.booking.companion.id = :companionId and t.status = com.hutech.nguyenphucthinh.model.Transaction.Status.COMPLETED")
    BigDecimal sumCompletedIncomeByCompanionId(Long companionId);
}
