package com.hutech.nguyenphucthinh.service.user;

import com.hutech.nguyenphucthinh.model.Booking;
import com.hutech.nguyenphucthinh.model.Review;
import com.hutech.nguyenphucthinh.repository.BookingRepository;
import com.hutech.nguyenphucthinh.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {
    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public Review createReview(Long customerId, Long bookingId, Integer rating, String comment) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt lịch"));

        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Bạn chỉ có thể đánh giá đơn của chính mình");
        }
        if (booking.getStatus() != Booking.Status.COMPLETED) {
            throw new RuntimeException("Chỉ đánh giá được đơn đã hoàn tất");
        }
        if (rating == null || rating < 1 || rating > 5) {
            throw new RuntimeException("Điểm đánh giá phải từ 1 đến 5");
        }
        if (reviewRepository.findByBookingId(bookingId).isPresent()) {
            throw new RuntimeException("Đơn này đã được đánh giá");
        }

        Review review = new Review();
        review.setBooking(booking);
        review.setRating(rating);
        review.setComment(comment);
        return reviewRepository.save(review);
    }

    public List<Review> getMyReviews(Long customerId) {
        return reviewRepository.findByBookingCustomerIdOrderByCreatedAtDesc(customerId);
    }
}
