package com.hutech.nguyenphucthinh.service.companion;

import com.hutech.nguyenphucthinh.model.Booking;
import com.hutech.nguyenphucthinh.model.CompanionAvailability;
import com.hutech.nguyenphucthinh.model.Consultation;
import com.hutech.nguyenphucthinh.model.Companion;
import com.hutech.nguyenphucthinh.model.ServicePrice;
import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.model.Withdrawal;
import com.hutech.nguyenphucthinh.repository.BookingRepository;
import com.hutech.nguyenphucthinh.repository.CompanionAvailabilityRepository;
import com.hutech.nguyenphucthinh.repository.CompanionRepository;
import com.hutech.nguyenphucthinh.repository.ConsultationRepository;
import com.hutech.nguyenphucthinh.repository.ServicePriceRepository;
import com.hutech.nguyenphucthinh.repository.TransactionRepository;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import com.hutech.nguyenphucthinh.repository.WithdrawalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.stream.Collectors;

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
    private ServicePriceRepository servicePriceRepository;
    @Autowired
    private WithdrawalRepository withdrawalRepository;

    public List<Companion> getAllCompanions() {
        return companionRepository.findByStatus(Companion.Status.APPROVED);
    }

    public Optional<Companion> getCompanionById(Long id) {
        return companionRepository.findById(id);
    }

    public Companion registerCompanion(Long userId, String bio, String hobbies, String appearance, String availability) {
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
        companion.setOnline(false);
        companion.setStatus(Companion.Status.PENDING);
        return companionRepository.save(companion);
    }

    public Companion getCompanionByUserId(Long userId) {
        return companionRepository.findByUserId(userId).orElseThrow(() -> new RuntimeException("Companion profile not found"));
    }

    public Companion updateProfile(Long userId, String bio, String hobbies, String appearance, String availability) {
        Companion companion = companionRepository.findByUserId(userId)
                .orElseGet(() -> registerCompanion(userId, bio, hobbies, appearance, availability));
        companion.setBio(bio);
        companion.setHobbies(hobbies);
        companion.setAppearance(appearance);
        companion.setAvailability(availability);
        return companionRepository.save(companion);
    }

    public Companion updateIdentity(Long userId, String identityNumber, String identityImageUrl, String portraitImageUrl) {
        Companion companion = getCompanionByUserId(userId);
        companion.setIdentityNumber(identityNumber);
        companion.setIdentityImageUrl(identityImageUrl);
        companion.setPortraitImageUrl(portraitImageUrl);
        return companionRepository.save(companion);
    }

    public Companion updateMediaAndSkills(Long userId, String introMediaUrls, String skills) {
        Companion companion = getCompanionByUserId(userId);
        companion.setIntroMediaUrls(introMediaUrls);
        companion.setSkills(skills);
        return companionRepository.save(companion);
    }

    public Companion setOnlineStatus(Long userId, boolean online) {
        Companion companion = getCompanionByUserId(userId);
        companion.setOnline(online);
        return companionRepository.save(companion);
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
        if (LocalDateTime.now().isAfter(booking.getCreatedAt().plusMinutes(10))) {
            booking.setStatus(Booking.Status.REJECTED);
            bookingRepository.save(booking);
            throw new RuntimeException("Request expired after 10 minutes");
        }
        booking.setStatus(status);
        if (status == Booking.Status.ACCEPTED) {
            booking.setAcceptedAt(LocalDateTime.now());
        }
        return bookingRepository.save(booking);
    }

    public Map<String, List<Booking>> getBookingWorkflow(Long userId) {
        Companion companion = getCompanionByUserId(userId);
        List<Booking> all = bookingRepository.findByCompanionIdOrderByBookingTimeDesc(companion.getId());
        LocalDateTime now = LocalDateTime.now();

        Map<String, List<Booking>> workflow = new HashMap<>();
        workflow.put("pending", all.stream().filter(b -> b.getStatus() == Booking.Status.PENDING).collect(Collectors.toList()));
        workflow.put("upcoming", all.stream().filter(b -> b.getStatus() == Booking.Status.ACCEPTED && b.getBookingTime().isAfter(now)).collect(Collectors.toList()));
        workflow.put("running", all.stream().filter(b -> b.getStatus() == Booking.Status.IN_PROGRESS).collect(Collectors.toList()));
        workflow.put("done", all.stream().filter(b -> b.getStatus() == Booking.Status.COMPLETED || b.getStatus() == Booking.Status.REJECTED).collect(Collectors.toList()));
        return workflow;
    }

    public Booking checkIn(Long userId, Long bookingId, Double lat, Double lng) {
        Companion companion = getCompanionByUserId(userId);
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("No permission");
        }
        if (booking.getStatus() != Booking.Status.ACCEPTED) {
            throw new RuntimeException("Booking is not in ACCEPTED state");
        }
        booking.setCheckInLatitude(lat);
        booking.setCheckInLongitude(lng);
        booking.setStartedAt(LocalDateTime.now());
        booking.setStatus(Booking.Status.IN_PROGRESS);
        return bookingRepository.save(booking);
    }

    public Booking checkOut(Long userId, Long bookingId, Double lat, Double lng) {
        Companion companion = getCompanionByUserId(userId);
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("No permission");
        }
        if (booking.getStatus() != Booking.Status.IN_PROGRESS) {
            throw new RuntimeException("Booking is not in IN_PROGRESS state");
        }
        booking.setCheckOutLatitude(lat);
        booking.setCheckOutLongitude(lng);
        booking.setCompletedAt(LocalDateTime.now());
        booking.setStatus(Booking.Status.COMPLETED);
        return bookingRepository.save(booking);
    }

    public Booking triggerSos(Long userId, Long bookingId, String note, Double lat, Double lng) {
        Companion companion = getCompanionByUserId(userId);
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("No permission");
        }
        booking.setSosTriggered(true);
        booking.setSosNote(note);
        booking.setCheckInLatitude(lat);
        booking.setCheckInLongitude(lng);
        return bookingRepository.save(booking);
    }

    public Booking rateUser(Long userId, Long bookingId, Integer rating, String review) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new RuntimeException("Rating must be in range 1-5");
        }
        Companion companion = getCompanionByUserId(userId);
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("No permission");
        }
        if (booking.getStatus() != Booking.Status.COMPLETED) {
            throw new RuntimeException("Only completed bookings can be rated");
        }
        booking.setCompanionRatingForUser(rating);
        booking.setCompanionReviewForUser(review);
        return bookingRepository.save(booking);
    }

    public Map<String, Object> getIncomeStats(Long userId) {
        Companion companion = getCompanionByUserId(userId);
        BigDecimal totalIncome = transactionRepository.sumCompletedIncomeByCompanionId(companion.getId());
        BigDecimal holdAmount = transactionRepository.sumPendingHoldByCompanionId(companion.getId());
        BigDecimal withdrawalLocked = withdrawalRepository.sumLockedAmountByCompanionId(companion.getId());
        BigDecimal availableBalance = totalIncome.subtract(withdrawalLocked);
        if (availableBalance.signum() < 0) {
            availableBalance = BigDecimal.ZERO;
        }
        long completedBookings = bookingRepository.countByCompanionIdAndStatus(companion.getId(), Booking.Status.COMPLETED);
        long acceptedBookings = bookingRepository.countByCompanionIdAndStatus(companion.getId(), Booking.Status.ACCEPTED);
        long inProgressBookings = bookingRepository.countByCompanionIdAndStatus(companion.getId(), Booking.Status.IN_PROGRESS);

        Map<String, Object> stats = new HashMap<>();
        stats.put("companionId", companion.getId());
        stats.put("totalIncome", totalIncome);
        stats.put("availableBalance", availableBalance);
        stats.put("holdAmount", holdAmount);
        stats.put("completedBookings", completedBookings);
        stats.put("acceptedBookings", acceptedBookings);
        stats.put("inProgressBookings", inProgressBookings);
        return stats;
    }

    public List<ServicePrice> getServicePrices(Long userId) {
        Companion companion = getCompanionByUserId(userId);
        return servicePriceRepository.findByCompanionIdOrderByIdDesc(companion.getId());
    }

    public ServicePrice addServicePrice(Long userId, String serviceName, BigDecimal pricePerHour, String description) {
        if (pricePerHour == null || pricePerHour.signum() <= 0) {
            throw new RuntimeException("Price must be greater than 0");
        }
        Companion companion = getCompanionByUserId(userId);
        ServicePrice item = new ServicePrice();
        item.setCompanion(companion);
        item.setServiceName(serviceName);
        item.setPricePerHour(pricePerHour);
        item.setDescription(description);
        return servicePriceRepository.save(item);
    }

    public void deleteServicePrice(Long userId, Long priceId) {
        Companion companion = getCompanionByUserId(userId);
        ServicePrice item = servicePriceRepository.findById(priceId).orElseThrow(() -> new RuntimeException("Price item not found"));
        if (!item.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("No permission");
        }
        servicePriceRepository.delete(item);
    }

    public List<Withdrawal> getWithdrawals(Long userId) {
        Companion companion = getCompanionByUserId(userId);
        return withdrawalRepository.findByCompanionIdOrderByCreatedAtDesc(companion.getId());
    }

    public Withdrawal createWithdrawal(Long userId, BigDecimal amount, String bankName, String bankAccountNumber, String accountHolderName) {
        if (amount == null || amount.signum() <= 0) {
            throw new RuntimeException("Withdraw amount must be greater than 0");
        }
        Companion companion = getCompanionByUserId(userId);
        BigDecimal available = transactionRepository.sumCompletedIncomeByCompanionId(companion.getId())
                .subtract(withdrawalRepository.sumLockedAmountByCompanionId(companion.getId()));
        if (available.signum() < 0) {
            available = BigDecimal.ZERO;
        }
        if (amount.compareTo(available) > 0) {
            throw new RuntimeException("Insufficient available balance");
        }
        Withdrawal withdrawal = new Withdrawal();
        withdrawal.setCompanion(companion);
        withdrawal.setAmount(amount);
        withdrawal.setBankName(bankName);
        withdrawal.setBankAccountNumber(bankAccountNumber);
        withdrawal.setAccountHolderName(accountHolderName);
        withdrawal.setStatus(Withdrawal.Status.PENDING);
        return withdrawalRepository.save(withdrawal);
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
