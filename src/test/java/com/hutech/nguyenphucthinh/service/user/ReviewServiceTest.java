package com.hutech.nguyenphucthinh.service.user;

import com.hutech.nguyenphucthinh.model.Booking;
import com.hutech.nguyenphucthinh.model.Review;
import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.repository.BookingRepository;
import com.hutech.nguyenphucthinh.repository.ReviewRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * White-box {@link ReviewService#createReview} — mục 4.3 (backend không kiểm tra độ dài comment như Chương 3).
 */
@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    private static final long BOOKING_ID = 100L;
    private static final long CUSTOMER_ID = 10L;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private ReviewService reviewService;

    @Test
    void createReviewSuccess() {
        Booking booking = completedBookingOwnedBy(CUSTOMER_ID);
        when(bookingRepository.findById(BOOKING_ID)).thenReturn(Optional.of(booking));
        when(reviewRepository.findByBookingId(BOOKING_ID)).thenReturn(Optional.empty());
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));

        Review out = reviewService.createReview(CUSTOMER_ID, BOOKING_ID, 4, "Nhận xét đủ mười ký tự.");

        assertEquals(4, out.getRating());
        assertEquals(booking, out.getBooking());
        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    void createReviewSuccessWithNullComment() {
        Booking booking = completedBookingOwnedBy(CUSTOMER_ID);
        when(bookingRepository.findById(BOOKING_ID)).thenReturn(Optional.of(booking));
        when(reviewRepository.findByBookingId(BOOKING_ID)).thenReturn(Optional.empty());
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));

        Review out = reviewService.createReview(CUSTOMER_ID, BOOKING_ID, 5, null);

        assertNull(out.getComment());
    }

    @Test
    void bookingNotFound() {
        when(bookingRepository.findById(BOOKING_ID)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.createReview(CUSTOMER_ID, BOOKING_ID, 5, "x"));
        assertTrue(ex.getMessage().contains("Không tìm thấy đơn"));
    }

    @Test
    void wrongCustomer() {
        Booking booking = completedBookingOwnedBy(999L);
        when(bookingRepository.findById(BOOKING_ID)).thenReturn(Optional.of(booking));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.createReview(CUSTOMER_ID, BOOKING_ID, 5, "Nội dung đánh giá đủ dài."));
        assertTrue(ex.getMessage().contains("chính mình"));
    }

    @Test
    void statusNotCompleted() {
        Booking booking = completedBookingOwnedBy(CUSTOMER_ID);
        booking.setStatus(Booking.Status.PENDING);
        when(bookingRepository.findById(BOOKING_ID)).thenReturn(Optional.of(booking));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.createReview(CUSTOMER_ID, BOOKING_ID, 5, "Nội dung đánh giá đủ dài."));
        assertTrue(ex.getMessage().contains("hoàn tất"));
    }

    @Test
    void ratingNull() {
        Booking booking = completedBookingOwnedBy(CUSTOMER_ID);
        when(bookingRepository.findById(BOOKING_ID)).thenReturn(Optional.of(booking));

        assertThrows(RuntimeException.class,
                () -> reviewService.createReview(CUSTOMER_ID, BOOKING_ID, null, "Nội dung đánh giá đủ dài."));
    }

    @Test
    void ratingOutOfRange() {
        Booking booking = completedBookingOwnedBy(CUSTOMER_ID);
        when(bookingRepository.findById(BOOKING_ID)).thenReturn(Optional.of(booking));

        assertThrows(RuntimeException.class,
                () -> reviewService.createReview(CUSTOMER_ID, BOOKING_ID, 6, "Nội dung đánh giá đủ dài."));
        assertThrows(RuntimeException.class,
                () -> reviewService.createReview(CUSTOMER_ID, BOOKING_ID, 0, "Nội dung đánh giá đủ dài."));
    }

    @Test
    void duplicateReview() {
        Booking booking = completedBookingOwnedBy(CUSTOMER_ID);
        when(bookingRepository.findById(BOOKING_ID)).thenReturn(Optional.of(booking));
        when(reviewRepository.findByBookingId(BOOKING_ID)).thenReturn(Optional.of(new Review()));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.createReview(CUSTOMER_ID, BOOKING_ID, 3, "Nội dung đánh giá đủ dài."));
        assertTrue(ex.getMessage().contains("đã được đánh giá"));
    }

    @Test
    void getMyReviewsDelegatesToRepository() {
        when(reviewRepository.findByBookingCustomerIdOrderByCreatedAtDesc(CUSTOMER_ID)).thenReturn(List.of());
        assertTrue(reviewService.getMyReviews(CUSTOMER_ID).isEmpty());
        verify(reviewRepository).findByBookingCustomerIdOrderByCreatedAtDesc(CUSTOMER_ID);
    }

    @Test
    void ratingBoundaryOneAndFive() {
        Booking booking = completedBookingOwnedBy(CUSTOMER_ID);
        when(bookingRepository.findById(BOOKING_ID)).thenReturn(Optional.of(booking));
        when(reviewRepository.findByBookingId(BOOKING_ID)).thenReturn(Optional.empty());
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));

        assertEquals(1, reviewService.createReview(CUSTOMER_ID, BOOKING_ID, 1, "a").getRating());
        assertEquals(5, reviewService.createReview(CUSTOMER_ID, BOOKING_ID, 5, "b").getRating());
        verify(reviewRepository, times(2)).save(any(Review.class));
    }

    private static Booking completedBookingOwnedBy(long customerId) {
        User customer = new User();
        customer.setId(customerId);
        Booking booking = new Booking();
        booking.setId(BOOKING_ID);
        booking.setCustomer(customer);
        booking.setStatus(Booking.Status.COMPLETED);
        return booking;
    }
}
