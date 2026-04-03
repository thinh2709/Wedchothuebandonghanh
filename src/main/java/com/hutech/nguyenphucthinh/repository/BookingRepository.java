package com.hutech.nguyenphucthinh.repository;

import com.hutech.nguyenphucthinh.model.Booking;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerIdOrderByBookingTimeDesc(Long customerId);
    List<Booking> findByCompanionIdOrderByBookingTimeDesc(Long companionId);
    List<Booking> findByCompanionIdAndStatusOrderByBookingTimeDesc(Long companionId, Booking.Status status);
    long countByCompanionIdAndStatus(Long companionId, Booking.Status status);

    List<Booking> findByStatusInOrderByBookingTimeDesc(Collection<Booking.Status> statuses);

    @Query("""
            select b from Booking b
            where b.status = com.hutech.nguyenphucthinh.model.Booking.Status.CANCELLED
              and (:excludeId is null or b.id <> :excludeId)
              and (
                    (b.cancelRequesterLatitude is not null and b.cancelRequesterLongitude is not null)
                 or (b.cancelConfirmerLatitude is not null and b.cancelConfirmerLongitude is not null)
              )
            order by b.cancelConfirmedAt desc, b.id desc
            """)
    List<Booking> findRecentCancelledWithGps(@Param("excludeId") Long excludeId, Pageable pageable);
}
