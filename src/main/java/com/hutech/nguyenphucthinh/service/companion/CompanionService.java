package com.hutech.nguyenphucthinh.service.companion;

import com.hutech.nguyenphucthinh.model.Booking;
import com.hutech.nguyenphucthinh.model.CompanionAvailability;
import com.hutech.nguyenphucthinh.model.Consultation;
import com.hutech.nguyenphucthinh.model.Companion;
import com.hutech.nguyenphucthinh.model.Transaction;
import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.repository.BookingRepository;
import com.hutech.nguyenphucthinh.repository.CompanionAvailabilityRepository;
import com.hutech.nguyenphucthinh.repository.CompanionRepository;
import com.hutech.nguyenphucthinh.repository.ConsultationRepository;
import com.hutech.nguyenphucthinh.repository.ReviewRepository;
import com.hutech.nguyenphucthinh.repository.TransactionRepository;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import com.hutech.nguyenphucthinh.service.user.NotificationService;
import com.hutech.nguyenphucthinh.service.user.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@Service
public class CompanionService {
    @Autowired
    private CompanionRepository companionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CompanionAvailabilityRepository availabilityRepository;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private ConsultationRepository consultationRepository;
    @Autowired
    private ReviewRepository reviewRepository;
    @Autowired
    private WalletService walletService;
    @Autowired
    private NotificationService notificationService;

    public List<Companion> getAllCompanions() {
        List<Companion> companions = companionRepository.findByStatus(Companion.Status.APPROVED);
        companions.forEach(this::attachStats);
        return companions;
    }

    public Optional<Companion> getCompanionById(Long id) {
        Optional<Companion> companion = companionRepository.findById(id);
        companion.ifPresent(this::attachStats);
        return companion;
    }

    private void attachStats(Companion companion) {
        long total = consultationRepository.countByCompanionId(companion.getId());
        long answered = consultationRepository.countByCompanionIdAndStatus(companion.getId(), Consultation.Status.ANSWERED);
        companion.setResponseRate(total == 0 ? 100.0 : (answered * 100.0) / total);
        
        Double avg = reviewRepository.getAverageRatingByCompanionId(companion.getId());
        companion.setAverageRating(avg != null ? avg : 0.0);
        companion.setReviewCount(reviewRepository.getReviewCountByCompanionId(companion.getId()));
    }

    public Companion registerCompanion(Long userId, String bio, String hobbies, String appearance, String availability,
                                       String serviceType, String area, String gender, String gameRank,
                                       Boolean onlineStatus, String avatarUrl, String introVideoUrl) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != User.Role.COMPANION) {
            user.setRole(User.Role.COMPANION);
            userRepository.save(user);
        }
        if (companionRepository.findByUserId(userId).isPresent()) {
            throw new RuntimeException("Companion profile already exists");
        }

        Companion companion = new Companion();
        companion.setUser(user);
        companion.setBio(bio);
        companion.setHobbies(hobbies);
        companion.setAppearance(appearance);
        companion.setAvailability(availability);
        companion.setServiceType(serviceType);
        companion.setArea(area);
        companion.setGender(gender);
        companion.setGameRank(gameRank);
        companion.setOnlineStatus(Boolean.TRUE.equals(onlineStatus));
        companion.setAvatarUrl(avatarUrl);
        companion.setIntroVideoUrl(introVideoUrl);
        companion.setStatus(Companion.Status.PENDING);
        return companionRepository.save(companion);
    }

    public Companion getCompanionByUserId(Long userId) {
        return companionRepository.findByUserId(userId).orElseThrow(() -> new RuntimeException("Companion profile not found"));
    }

    public Companion updateProfile(Long userId, String bio, String hobbies, String appearance, String availability,
                                   String serviceType, String area, String gender, String gameRank,
                                   Boolean onlineStatus, String avatarUrl, String introVideoUrl) {
        Companion companion = getCompanionByUserId(userId);
        companion.setBio(bio);
        companion.setHobbies(hobbies);
        companion.setAppearance(appearance);
        companion.setAvailability(availability);
        companion.setServiceType(serviceType);
        companion.setArea(area);
        companion.setGender(gender);
        companion.setGameRank(gameRank);
        companion.setOnlineStatus(Boolean.TRUE.equals(onlineStatus));
        companion.setAvatarUrl(avatarUrl);
        companion.setIntroVideoUrl(introVideoUrl);
        return companionRepository.save(companion);
    }

    public List<Companion> searchCompanions(String serviceType, String area, String gender, String gameRank,
                                            Boolean online, BigDecimal minPrice, BigDecimal maxPrice) {
        return getAllCompanions().stream().filter(c -> {
            boolean ok = true;
            if (serviceType != null && !serviceType.isBlank()) ok = ok && serviceType.equalsIgnoreCase(c.getServiceType());
            if (area != null && !area.isBlank()) ok = ok && c.getArea() != null && c.getArea().toLowerCase().contains(area.toLowerCase());
            if (gender != null && !gender.isBlank()) ok = ok && gender.equalsIgnoreCase(c.getGender());
            if (gameRank != null && !gameRank.isBlank()) ok = ok && c.getGameRank() != null && c.getGameRank().toLowerCase().contains(gameRank.toLowerCase());
            if (online != null) ok = ok && online.equals(c.getOnlineStatus());
            if (minPrice != null) ok = ok && c.getPricePerHour() != null && c.getPricePerHour().compareTo(minPrice) >= 0;
            if (maxPrice != null) ok = ok && c.getPricePerHour() != null && c.getPricePerHour().compareTo(maxPrice) <= 0;
            return ok;
        }).toList();
    }

    public List<CompanionAvailability> getAvailabilities(Long userId) {
        Companion companion = getCompanionByUserId(userId);
        return availabilityRepository.findByCompanionIdOrderByStartTimeAsc(companion.getId());
    }

    public CompanionAvailability addAvailability(Long userId, LocalDateTime startTime, LocalDateTime endTime, String note) {
        if (endTime.isBefore(startTime) || endTime.isEqual(startTime)) {
            throw new RuntimeException("Invalid availability range");
        }
        Companion companion = getCompanionByUserId(userId);
        CompanionAvailability slot = new CompanionAvailability();
        slot.setCompanion(companion);
        slot.setStartTime(startTime);
        slot.setEndTime(endTime);
        slot.setNote(note);
        return availabilityRepository.save(slot);
    }

    public void removeAvailability(Long userId, Long availabilityId) {
        Companion companion = getCompanionByUserId(userId);
        CompanionAvailability slot = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new RuntimeException("Availability not found"));
        if (!slot.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("No permission to remove availability");
        }
        availabilityRepository.delete(slot);
    }

    public List<Booking> getBookingsForCompanion(Long userId) {
        Companion companion = getCompanionByUserId(userId);
        return bookingRepository.findByCompanionIdOrderByBookingTimeDesc(companion.getId());
    }

    public Booking updateBookingStatus(Long userId, Long bookingId, Booking.Status status) {
        if (status != Booking.Status.ACCEPTED && status != Booking.Status.REJECTED) {
            throw new RuntimeException("Only ACCEPTED/REJECTED status is allowed");
        }
        Companion companion = getCompanionByUserId(userId);
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("No permission to update this booking");
        }
        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new RuntimeException("Booking already processed");
        }
        if (status == Booking.Status.ACCEPTED) {
            walletService.holdForBooking(booking.getCustomer(), booking, booking.getHoldAmount());
            notificationService.create(
                    booking.getCustomer().getId(),
                    "Booking duoc chap nhan",
                    "Companion da chap nhan don #" + booking.getId() + ". Ban co the chat/call ngay."
            );
        }
        if (status == Booking.Status.REJECTED) {
            notificationService.create(
                    booking.getCustomer().getId(),
                    "Booking bi tu choi",
                    "Companion da tu choi don #" + booking.getId() + ". Ban hay dat lai voi companion khac."
            );
        }
        booking.setStatus(status);
        return bookingRepository.save(booking);
    }

    public Map<String, Object> getIncomeStats(Long userId) {
        Companion companion = getCompanionByUserId(userId);
        BigDecimal totalIncome = transactionRepository.sumCompletedIncomeByCompanionId(companion.getId());
        long completedBookings = bookingRepository.countByCompanionIdAndStatus(companion.getId(), Booking.Status.COMPLETED);
        long acceptedBookings = bookingRepository.countByCompanionIdAndStatus(companion.getId(), Booking.Status.ACCEPTED);

        Map<String, Object> stats = new HashMap<>();
        stats.put("companionId", companion.getId());
        stats.put("totalIncome", totalIncome);
        stats.put("completedBookings", completedBookings);
        stats.put("acceptedBookings", acceptedBookings);
        return stats;
    }

    public List<Consultation> getConsultations(Long userId) {
        Companion companion = getCompanionByUserId(userId);
        return consultationRepository.findByCompanionIdOrderByCreatedAtDesc(companion.getId());
    }

    public Consultation answerConsultation(Long userId, Long consultationId, String answer) {
        Companion companion = getCompanionByUserId(userId);
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("Consultation not found"));
        if (!consultation.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("No permission to answer this consultation");
        }
        consultation.setAnswer(answer);
        consultation.setStatus(Consultation.Status.ANSWERED);
        consultation.setAnsweredAt(LocalDateTime.now());
        return consultationRepository.save(consultation);
    }

    public Consultation createConsultation(Long customerId, Long companionId, String question) {
        User customer = userRepository.findById(customerId).orElseThrow(() -> new RuntimeException("Customer not found"));
        Companion companion = companionRepository.findById(companionId).orElseThrow(() -> new RuntimeException("Companion not found"));

        Consultation consultation = new Consultation();
        consultation.setCustomer(customer);
        consultation.setCompanion(companion);
        consultation.setQuestion(question);
        consultation.setStatus(Consultation.Status.PENDING);
        return consultationRepository.save(consultation);
    }
}
