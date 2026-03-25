package com.hutech.nguyenphucthinh.controller.companion;

import com.hutech.nguyenphucthinh.model.Booking;
import com.hutech.nguyenphucthinh.model.Companion;
import com.hutech.nguyenphucthinh.model.CompanionAvailability;
import com.hutech.nguyenphucthinh.model.Consultation;
import com.hutech.nguyenphucthinh.model.ServicePrice;
import com.hutech.nguyenphucthinh.model.Withdrawal;
import com.hutech.nguyenphucthinh.service.companion.CompanionService;
import com.hutech.nguyenphucthinh.service.user.BookingService;
import com.hutech.nguyenphucthinh.util.RequestBodyParseUtil;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/companions")
public class CompanionController {

    @Autowired
    private CompanionService companionService;
    @Autowired
    private BookingService bookingService;

    @GetMapping
    public List<Companion> getAllCompanions() {
        return companionService.getAllCompanions();
    }

    @GetMapping("/search")
    public List<Companion> searchCompanions(
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) Boolean online,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice
    ) {
        return companionService.searchCompanions(serviceType, area, gender, online, minPrice, maxPrice);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Companion> getCompanionById(@PathVariable Long id) {
        return companionService.getCompanionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/service-prices")
    public List<ServicePrice> getServicePricesByCompanionId(@PathVariable Long id) {
        return companionService.getServicePricesByCompanionId(id);
    }

    @PostMapping("/register")
    public Companion registerCompanion(@RequestBody Map<String, String> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Vui lòng đăng nhập trước");
        }
        Companion companion = companionService.registerCompanion(
                userId,
                request.getOrDefault("bio", ""),
                request.getOrDefault("hobbies", ""),
                request.getOrDefault("appearance", ""),
                request.getOrDefault("availability", ""),
                request.getOrDefault("serviceType", ""),
                request.getOrDefault("area", ""),
                request.getOrDefault("rentalVenues", ""),
                request.getOrDefault("gender", ""),
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
        return companionService.updateProfile(userId, request);
    }

    @PutMapping("/me/identity")
    public Companion updateIdentity(@RequestBody Map<String, String> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.updateIdentity(
                userId,
                request.getOrDefault("identityNumber", ""),
                request.getOrDefault("identityImageUrl", ""),
                request.getOrDefault("portraitImageUrl", "")
        );
    }

    @PutMapping("/me/media-skills")
    public Companion updateMediaAndSkills(@RequestBody Map<String, String> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.updateMediaAndSkills(
                userId,
                request.getOrDefault("introMediaUrls", ""),
                request.getOrDefault("skills", "")
        );
    }

    @PatchMapping("/me/online")
    public Companion setOnlineStatus(@RequestBody Map<String, Boolean> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.setOnlineStatus(userId, Boolean.TRUE.equals(request.get("online")));
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

    @GetMapping("/me/bookings/workflow")
    public Map<String, List<Booking>> getBookingWorkflow(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.getBookingWorkflow(userId);
    }

    @PostMapping("/me/bookings/{bookingId}/extension/accept")
    public Booking acceptBookingExtension(@PathVariable Long bookingId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return bookingService.acceptBookingExtension(userId, bookingId);
    }

    @PostMapping("/me/bookings/{bookingId}/extension/reject")
    public Booking rejectBookingExtension(@PathVariable Long bookingId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return bookingService.rejectBookingExtension(userId, bookingId);
    }

    @PostMapping("/me/bookings/{bookingId}/checkin")
    public Booking checkIn(@PathVariable Long bookingId, @RequestBody Map<String, Object> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.checkIn(
                userId,
                bookingId,
                RequestBodyParseUtil.readDouble(request, "lat"),
                RequestBodyParseUtil.readDouble(request, "lng")
        );
    }

    @PostMapping("/me/bookings/{bookingId}/checkout")
    public Booking checkOut(@PathVariable Long bookingId, @RequestBody Map<String, Object> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.checkOut(
                userId,
                bookingId,
                RequestBodyParseUtil.readDouble(request, "lat"),
                RequestBodyParseUtil.readDouble(request, "lng")
        );
    }

    @PostMapping("/me/bookings/{bookingId}/sos")
    public Booking triggerSos(@PathVariable Long bookingId, @RequestBody Map<String, Object> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.triggerSos(
                userId,
                bookingId,
                RequestBodyParseUtil.readString(request, "note", ""),
                RequestBodyParseUtil.readDouble(request, "lat"),
                RequestBodyParseUtil.readDouble(request, "lng")
        );
    }

    @PostMapping("/me/bookings/{bookingId}/rate-user")
    public Booking rateUser(@PathVariable Long bookingId, @RequestBody Map<String, String> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.rateUser(
                userId,
                bookingId,
                request.get("rating") == null ? null : Integer.valueOf(request.get("rating")),
                request.getOrDefault("review", "")
        );
    }

    @GetMapping("/me/income-stats")
    public Map<String, Object> getMyIncomeStats(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.getIncomeStats(userId);
    }

    @GetMapping("/me/service-prices")
    public List<ServicePrice> getMyServicePrices(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.getServicePrices(userId);
    }

    @PostMapping("/me/service-prices")
    public ServicePrice addServicePrice(@RequestBody Map<String, String> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.addServicePrice(
                userId,
                request.getOrDefault("serviceName", ""),
                request.get("pricePerHour") == null ? null : new BigDecimal(request.get("pricePerHour")),
                request.getOrDefault("description", "")
        );
    }

    @DeleteMapping("/me/service-prices/{priceId}")
    public void deleteServicePrice(@PathVariable Long priceId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        companionService.deleteServicePrice(userId, priceId);
    }

    @GetMapping("/me/withdrawals")
    public List<Withdrawal> getMyWithdrawals(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.getWithdrawals(userId);
    }

    @GetMapping("/me/bank-account")
    public Map<String, String> getMyBankAccount(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.getPayoutBankAccount(userId);
    }

    @PutMapping("/me/bank-account")
    public Map<String, String> updateMyBankAccount(@RequestBody Map<String, String> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.updatePayoutBankAccount(
                userId,
                request.getOrDefault("bankName", ""),
                request.getOrDefault("bankAccountNumber", ""),
                request.getOrDefault("accountHolderName", "")
        );
    }

    @PostMapping("/me/withdrawals")
    public Withdrawal createWithdrawal(@RequestBody Map<String, String> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return companionService.createWithdrawal(
                userId,
                request.get("amount") == null ? null : new BigDecimal(request.get("amount"))
        );
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
