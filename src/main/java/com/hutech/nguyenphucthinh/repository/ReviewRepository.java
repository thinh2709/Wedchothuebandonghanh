package com.hutech.nguyenphucthinh.repository;

import com.hutech.nguyenphucthinh.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByBookingId(Long bookingId);
    List<Review> findByBookingCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Review> findByBookingCompanionIdOrderByCreatedAtDesc(Long companionId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.booking.companion.id = :companionId")
    Double getAverageRatingByCompanionId(@Param("companionId") Long companionId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.booking.companion.id = :companionId")
    Long getReviewCountByCompanionId(@Param("companionId") Long companionId);
}
