package com.hutech.nguyenphucthinh.model;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(length = 20)
    private String identityNumber;

    @Column(columnDefinition = "TEXT")
    private String identityImageUrl;

    @Column(columnDefinition = "TEXT")
    private String portraitImageUrl;

    @Column(columnDefinition = "TEXT")
    private String introMediaUrls;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(nullable = false)
    private Boolean online = false;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    public enum Status {
        PENDING, APPROVED, REJECTED
    }
}
