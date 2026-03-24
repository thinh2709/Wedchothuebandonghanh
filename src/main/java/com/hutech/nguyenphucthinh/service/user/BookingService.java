package com.hutech.nguyenphucthinh.service.user;

import com.hutech.nguyenphucthinh.model.Booking;
import com.hutech.nguyenphucthinh.model.Companion;
import com.hutech.nguyenphucthinh.model.Transaction;
import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.repository.BookingRepository;
import com.hutech.nguyenphucthinh.repository.CompanionRepository;
import com.hutech.nguyenphucthinh.repository.TransactionRepository;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {
    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanionRepository companionRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private WalletService walletService;
    @Autowired
    private NotificationService notificationService;

    private BigDecimal calculateHoldAmount(Companion companion, Integer duration) {
        BigDecimal pricePerHour = companion.getPricePerHour();
        if (pricePerHour == null) pricePerHour = new BigDecimal("200000");
        
        // duration in minutes, pricePerHour is for 60 minutes
        BigDecimal durationInHours = BigDecimal.valueOf(duration).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        return pricePerHour.multiply(durationInHours).setScale(0, RoundingMode.HALF_UP);
    }

    public Booking createBooking(Long customerId, Long companionId, String bookingTime, Integer duration, String location, String note) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng"));
        Companion companion = companionRepository.findById(companionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy companion"));
        if (duration == null || duration < 30) {
            throw new RuntimeException("Thời lượng tối thiểu là 30 phút");
        }

        Booking booking = new Booking();
        booking.setCustomer(customer);
        booking.setCompanion(companion);
        booking.setBookingTime(LocalDateTime.parse(bookingTime));
        booking.setDuration(duration);
        booking.setLocation(location);
        booking.setNote(note);
        booking.setHoldAmount(calculateHoldAmount(companion, duration));
        booking.setStatus(Booking.Status.PENDING);
        return bookingRepository.save(booking);
    }

    public List<Booking> getBookingsByCustomer(Long customerId) {
        return bookingRepository.findByCustomerIdOrderByBookingTimeDesc(customerId);
    }

    public Booking cancelBooking(Long customerId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt lịch"));
        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Bạn không có quyền hủy đơn này");
        }
        if (booking.getStatus() == Booking.Status.COMPLETED || booking.getStatus() == Booking.Status.CANCELLED) {
            throw new RuntimeException("Đơn đặt lịch không thể hủy");
        }
        if (booking.getStatus() == Booking.Status.IN_PROGRESS) {
            throw new RuntimeException("Booking đang diễn ra, không thể hủy");
        }
        if (booking.getStatus() == Booking.Status.ACCEPTED) {
            BigDecimal refundAmount = calculateRefundAmount(booking);
            if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
                walletService.refundForBooking(booking.getCustomer(), booking, refundAmount);
            }
        }
        booking.setStatus(Booking.Status.CANCELLED);
        notificationService.create(
                booking.getCustomer().getId(),
                "Booking đã hủy",
                "Đơn #" + booking.getId() + " đã được hủy theo chính sách hoàn tiền."
        );
        return bookingRepository.save(booking);
    }

    private BigDecimal calculateRefundAmount(Booking booking) {
        long minutesBeforeStart = Duration.between(LocalDateTime.now(), booking.getBookingTime()).toMinutes();
        BigDecimal ratio;
        if (minutesBeforeStart >= 1440) ratio = BigDecimal.ONE; // >=24h: 100%
        else if (minutesBeforeStart >= 360) ratio = new BigDecimal("0.50"); // 6h-24h: 50%
        else ratio = BigDecimal.ZERO; // <6h: 0%
        return booking.getHoldAmount().multiply(ratio).setScale(0, RoundingMode.DOWN);
    }

    public Booking checkIn(Long customerId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt lịch"));
        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Bạn không có quyền check-in đơn này");
        }
        if (booking.getStatus() != Booking.Status.ACCEPTED) {
            throw new RuntimeException("Đơn phải ở trạng thái ACCEPTED trước khi check-in");
        }
        booking.setStatus(Booking.Status.IN_PROGRESS);
        return bookingRepository.save(booking);
    }

    public Booking checkOut(Long customerId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt lịch"));
        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Bạn không có quyền check-out đơn này");
        }
        if (booking.getStatus() != Booking.Status.IN_PROGRESS) {
            throw new RuntimeException("Đơn phải ở trạng thái IN_PROGRESS trước khi check-out");
        }
        booking.setStatus(Booking.Status.COMPLETED);
        Transaction tx = new Transaction();
        tx.setBooking(booking);
        tx.setAmount(booking.getHoldAmount());
        tx.setStatus(Transaction.Status.COMPLETED);
        transactionRepository.save(tx);
        walletService.chargeForBooking(booking.getCustomer(), booking, booking.getHoldAmount());
        notificationService.create(
                booking.getCustomer().getId(),
                "Booking hoàn tất",
                "Đơn #" + booking.getId() + " đã kết thúc. Bạn có thể để lại đánh giá."
        );
        return bookingRepository.save(booking);
    }

    public Booking extendBooking(Long customerId, Long bookingId, Integer extraMinutes) {
        if (extraMinutes == null || extraMinutes < 30 || extraMinutes % 30 != 0) {
            throw new RuntimeException("Gia hạn tối thiểu 30 phút và bước 30 phút");
        }
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt lịch"));
        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Bạn không có quyền gia hạn đơn này");
        }
        if (booking.getStatus() != Booking.Status.ACCEPTED && booking.getStatus() != Booking.Status.IN_PROGRESS) {
            throw new RuntimeException("Chỉ gia hạn khi đơn ở trạng thái ACCEPTED/IN_PROGRESS");
        }
        BigDecimal extraHold = calculateHoldAmount(booking.getCompanion(), extraMinutes);
        walletService.holdForBooking(booking.getCustomer(), booking, extraHold);
        booking.setDuration(booking.getDuration() + extraMinutes);
        booking.setHoldAmount(booking.getHoldAmount().add(extraHold));
        return bookingRepository.save(booking);
    }
}
