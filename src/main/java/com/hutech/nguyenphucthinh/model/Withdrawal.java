package com.hutech.nguyenphucthinh.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "withdrawals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Withdrawal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "companion_id", nullable = false)
    private Companion companion;

    /** Số tiền trừ từ thu nhập companion (tổng yêu cầu rút, đã khóa). */
    @Column(nullable = false)
    private BigDecimal amount;

    /** Hoa hồng nền tảng trừ trên lệnh rút (theo tỷ lệ admin). */
    @Column
    private BigDecimal commissionAmount;

    /** Số tiền thực chuyển khoản cho companion (amount - commission). */
    @Column
    private BigDecimal netAmount;

    @Column(nullable = false, length = 100)
    private String bankName;

    @Column(nullable = false, length = 30)
    private String bankAccountNumber;

    @Column(nullable = false, length = 100)
    private String accountHolderName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Status {
        PENDING, APPROVED, REJECTED, PAID
    }
}
