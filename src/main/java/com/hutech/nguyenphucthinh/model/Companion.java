package com.hutech.nguyenphucthinh.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "companions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Companion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(columnDefinition = "TEXT")
    private String hobbies;

    @Column(columnDefinition = "TEXT")
    private String appearance;

    @Column(columnDefinition = "TEXT")
    private String availability;

    @Column(length = 50)
    private String serviceType;

    @Column(length = 120)
    private String area;

    /** Mỗi dòng là một nơi thuê khách được chọn khi đặt lịch. */
    @Column(columnDefinition = "TEXT")
    private String rentalVenues;

    @Column(length = 20)
    private String gender;

    @Column(name = "online", nullable = false)
    private Boolean onlineStatus = false;

    @Column(nullable = false)
    private BigDecimal pricePerHour = BigDecimal.valueOf(200000);

    @Column(length = 500)
    private String avatarUrl;

    @Column(length = 500)
    private String introVideoUrl;

    @Column(length = 30)
    private String identityNumber;

    @Column(length = 500)
    private String identityImageUrl;

    @Column(length = 500)
    private String portraitImageUrl;

    @Column(columnDefinition = "TEXT")
    private String introMediaUrls;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(length = 100)
    private String payoutBankName;

    @Column(length = 30)
    private String payoutBankAccountNumber;

    @Column(length = 100)
    private String payoutAccountHolderName;

    @Transient
    private Double responseRate;

    @Transient
    private Double averageRating;

    @Transient
    private Long reviewCount;

    /** Min/max giá VND/giờ theo bảng dịch vụ (service_prices); gắn khi trả API. */
    @Transient
    private BigDecimal servicePriceMin;

    @Transient
    private BigDecimal servicePriceMax;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    @PrePersist
    void prePersistDefaults() {
        if (onlineStatus == null) {
            onlineStatus = false;
        }
        if (pricePerHour == null) {
            pricePerHour = BigDecimal.valueOf(200000);
        }
        if (status == null) {
            status = Status.PENDING;
        }
    }

    public enum Status {
        PENDING, APPROVED, REJECTED
    }
}
