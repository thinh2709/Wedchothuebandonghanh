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

    @Column(length = 20)
    private String gender;

    @Column(length = 50)
    private String gameRank;

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

    @Transient
    private Double responseRate;

    @Transient
    private Double averageRating;

    @Transient
    private Long reviewCount;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    public enum Status {
        PENDING, APPROVED, REJECTED
    }
}
