package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.model.Booking;
import com.hutech.nguyenphucthinh.service.user.BookingService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    @Autowired
    private BookingService bookingService;

    @PostMapping
    public Booking createBooking(@RequestBody Map<String, Object> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        Number companionId = (Number) request.get("companionId");
        String bookingTime = (String) request.get("bookingTime");
        Number duration = (Number) request.get("duration");
        String location = (String) request.getOrDefault("location", "");
        String note = (String) request.getOrDefault("note", "");
        if (companionId == null || bookingTime == null || duration == null) {
            throw new RuntimeException("companionId, bookingTime, duration are required");
        }
        return bookingService.createBooking(userId, companionId.longValue(), bookingTime, duration.intValue(), location, note);
    }

    @GetMapping("/me")
    public List<Booking> getMyBookings(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return bookingService.getBookingsByCustomer(userId);
    }

    @PatchMapping("/me/{bookingId}/cancel")
    public Booking cancelBooking(@PathVariable Long bookingId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Please login first");
        return bookingService.cancelBooking(userId, bookingId);
    }

    @PatchMapping("/me/{bookingId}/check-in")
    public Booking checkIn(@PathVariable Long bookingId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Please login first");
        return bookingService.checkIn(userId, bookingId);
    }

    @PatchMapping("/me/{bookingId}/check-out")
    public Booking checkOut(@PathVariable Long bookingId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Please login first");
        return bookingService.checkOut(userId, bookingId);
    }

    @PatchMapping("/me/{bookingId}/extend")
    public Booking extendBooking(@PathVariable Long bookingId, @RequestBody Map<String, Object> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Please login first");
        Number extraMinutes = (Number) request.get("extraMinutes");
        if (extraMinutes == null) throw new RuntimeException("extraMinutes is required");
        return bookingService.extendBooking(userId, bookingId, extraMinutes.intValue());
    }

    @GetMapping("/customer/{customerId}")
    public List<Booking> getCustomerBookings(@PathVariable Long customerId) {
        return bookingService.getBookingsByCustomer(customerId);
    }
}
