package com.hutech.nguyenphucthinh.controller.companion;

import com.hutech.nguyenphucthinh.model.Booking;
import com.hutech.nguyenphucthinh.model.Companion;
import com.hutech.nguyenphucthinh.model.CompanionAvailability;
import com.hutech.nguyenphucthinh.model.Consultation;
import com.hutech.nguyenphucthinh.service.companion.CompanionService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/companions")
public class CompanionController {

    @Autowired
    private CompanionService companionService;

    @GetMapping
    public List<Companion> getAllCompanions() {
        return companionService.getAllCompanions();
    }

    @GetMapping("/search")
    public List<Companion> searchCompanions(
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String gameRank,
            @RequestParam(required = false) Boolean online,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice
    ) {
        return companionService.searchCompanions(serviceType, area, gender, gameRank, online, minPrice, maxPrice);
    }

    @GetMapping("/{id}")
    public Optional<Companion> getCompanionById(@PathVariable Long id) {
        return companionService.getCompanionById(id);
    }

    @PostMapping("/register")
    public Companion registerCompanion(@RequestBody Map<String, String> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        Companion companion = companionService.registerCompanion(
                userId,
                request.getOrDefault("bio", ""),
                request.getOrDefault("hobbies", ""),
                request.getOrDefault("appearance", ""),
                request.getOrDefault("availability", ""),
                request.getOrDefault("serviceType", ""),
                request.getOrDefault("area", ""),
                request.getOrDefault("gender", ""),
                request.getOrDefault("gameRank", ""),
                Boolean.parseBoolean(request.getOrDefault("onlineStatus", "false")),
                request.getOrDefault("avatarUrl", ""),
                request.getOrDefault("introVideoUrl", "")
        );
        session.setAttribute("role", "COMPANION");
        return companion;
    }

    @GetMapping("/me/profile")
    public Companion getMyProfile(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.getCompanionByUserId(userId);
    }

    @PutMapping("/me/profile")
    public Companion updateMyProfile(@RequestBody Map<String, String> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.updateProfile(
                userId,
                request.getOrDefault("bio", ""),
                request.getOrDefault("hobbies", ""),
                request.getOrDefault("appearance", ""),
                request.getOrDefault("availability", ""),
                request.getOrDefault("serviceType", ""),
                request.getOrDefault("area", ""),
                request.getOrDefault("gender", ""),
                request.getOrDefault("gameRank", ""),
                Boolean.parseBoolean(request.getOrDefault("onlineStatus", "false")),
                request.getOrDefault("avatarUrl", ""),
                request.getOrDefault("introVideoUrl", "")
        );
    }

    @GetMapping("/me/availabilities")
    public List<CompanionAvailability> getMyAvailabilities(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.getAvailabilities(userId);
    }

    @PostMapping("/me/availabilities")
    public CompanionAvailability addAvailability(@RequestBody Map<String, String> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.addAvailability(
                userId,
                LocalDateTime.parse(request.get("startTime")),
                LocalDateTime.parse(request.get("endTime")),
                request.getOrDefault("note", "")
        );
    }

    @DeleteMapping("/me/availabilities/{availabilityId}")
    public void removeAvailability(@PathVariable Long availabilityId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        companionService.removeAvailability(userId, availabilityId);
    }

    @GetMapping("/me/bookings")
    public List<Booking> getMyBookings(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.getBookingsForCompanion(userId);
    }

    @PatchMapping("/me/bookings/{bookingId}")
    public Booking updateBookingStatus(@PathVariable Long bookingId, @RequestBody Map<String, String> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.updateBookingStatus(userId, bookingId, Booking.Status.valueOf(request.get("status")));
    }

    @GetMapping("/me/income-stats")
    public Map<String, Object> getMyIncomeStats(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.getIncomeStats(userId);
    }

    @GetMapping("/me/consultations")
    public List<Consultation> getMyConsultations(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.getConsultations(userId);
    }

    @PatchMapping("/me/consultations/{consultationId}/answer")
    public Consultation answerConsultation(@PathVariable Long consultationId, @RequestBody Map<String, String> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.answerConsultation(userId, consultationId, request.get("answer"));
    }

    @PostMapping("/{companionId}/consultations")
    public Consultation createConsultation(@PathVariable Long companionId, @RequestBody Map<String, String> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.createConsultation(userId, companionId, request.get("question"));
    }
}
