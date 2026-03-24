package com.hutech.nguyenphucthinh.service.companion;

import com.hutech.nguyenphucthinh.model.Booking;
import com.hutech.nguyenphucthinh.model.CompanionAvailability;
import com.hutech.nguyenphucthinh.model.Consultation;
import com.hutech.nguyenphucthinh.model.Companion;
import com.hutech.nguyenphucthinh.model.ServicePrice;
import com.hutech.nguyenphucthinh.model.User;
import com.hutech.nguyenphucthinh.model.Transaction;
import com.hutech.nguyenphucthinh.model.Withdrawal;
import com.hutech.nguyenphucthinh.repository.BookingRepository;
import com.hutech.nguyenphucthinh.repository.CompanionAvailabilityRepository;
import com.hutech.nguyenphucthinh.repository.CompanionRepository;
import com.hutech.nguyenphucthinh.repository.ConsultationRepository;
import com.hutech.nguyenphucthinh.repository.ReviewRepository;
import com.hutech.nguyenphucthinh.repository.ServicePriceRepository;
import com.hutech.nguyenphucthinh.repository.TransactionRepository;
import com.hutech.nguyenphucthinh.repository.UserRepository;
import com.hutech.nguyenphucthinh.repository.WithdrawalRepository;
import com.hutech.nguyenphucthinh.service.user.NotificationService;
import com.hutech.nguyenphucthinh.service.user.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
    private ReviewRepository reviewRepository;
    @Autowired
    private WalletService walletService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private ServicePriceRepository servicePriceRepository;
    @Autowired
    private WithdrawalRepository withdrawalRepository;

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
                                       String serviceType, String area, String rentalVenues, String gender, String gameRank,
                                       Boolean onlineStatus, String avatarUrl, String introVideoUrl) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        if (user.getRole() != User.Role.COMPANION) {
            user.setRole(User.Role.COMPANION);
            userRepository.save(user);
        }
        if (companionRepository.findByUserId(userId).isPresent()) {
            throw new RuntimeException("Hồ sơ companion đã tồn tại");
        }

        Companion companion = new Companion();
        companion.setUser(user);
        companion.setBio(bio);
        companion.setHobbies(hobbies);
        companion.setAppearance(appearance);
        companion.setAvailability(availability);
        companion.setServiceType(serviceType);
        companion.setArea(area);
        companion.setRentalVenues(rentalVenues);
        companion.setGender(gender);
        companion.setGameRank(gameRank);
        companion.setOnlineStatus(Boolean.TRUE.equals(onlineStatus));
        companion.setAvatarUrl(avatarUrl);
        companion.setIntroVideoUrl(introVideoUrl);
        companion.setStatus(Companion.Status.PENDING);
        return companionRepository.save(companion);
    }

    public Companion getCompanionByUserId(Long userId) {
        return companionRepository.findByUserId(userId).orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ companion"));
    }

    /** Chỉ cập nhật các field có trong request (tránh ghi đè mất dữ liệu khi client gửi thiếu key). */
    public Companion updateProfile(Long userId, Map<String, String> request) {
        Companion companion = getCompanionByUserId(userId);
        if (request.containsKey("bio")) {
            companion.setBio(request.get("bio"));
        }
        if (request.containsKey("hobbies")) {
            companion.setHobbies(request.get("hobbies"));
        }
        if (request.containsKey("appearance")) {
            companion.setAppearance(request.get("appearance"));
        }
        if (request.containsKey("availability")) {
            companion.setAvailability(request.get("availability"));
        }
        if (request.containsKey("serviceType")) {
            companion.setServiceType(request.get("serviceType"));
        }
        if (request.containsKey("area")) {
            companion.setArea(request.get("area"));
        }
        if (request.containsKey("rentalVenues")) {
            companion.setRentalVenues(request.get("rentalVenues"));
        }
        if (request.containsKey("gender")) {
            companion.setGender(request.get("gender"));
        }
        if (request.containsKey("gameRank")) {
            companion.setGameRank(request.get("gameRank"));
        }
        if (request.containsKey("onlineStatus")) {
            companion.setOnlineStatus(Boolean.parseBoolean(request.get("onlineStatus")));
        }
        if (request.containsKey("avatarUrl")) {
            companion.setAvatarUrl(request.get("avatarUrl"));
        }
        if (request.containsKey("introVideoUrl")) {
            companion.setIntroVideoUrl(request.get("introVideoUrl"));
        }
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
        companion.setOnlineStatus(online);
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
            throw new RuntimeException("Khoảng thời gian rảnh không hợp lệ");
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khung giờ rảnh"));
        if (!slot.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("Bạn không có quyền xóa khung giờ rảnh này");
        }
        availabilityRepository.delete(slot);
    }

    public List<Booking> getBookingsForCompanion(Long userId) {
        Companion companion = getCompanionByUserId(userId);
        return bookingRepository.findByCompanionIdOrderByBookingTimeDesc(companion.getId());
    }

    public Booking updateBookingStatus(Long userId, Long bookingId, Booking.Status status) {
        if (status != Booking.Status.ACCEPTED && status != Booking.Status.REJECTED) {
            throw new RuntimeException("Chỉ cho phép trạng thái ACCEPTED/REJECTED");
        }
        Companion companion = getCompanionByUserId(userId);
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt lịch"));
        if (!booking.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("Bạn không có quyền cập nhật đơn này");
        }
        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new RuntimeException("Đơn đặt lịch đã được xử lý");
        }
        if (status == Booking.Status.ACCEPTED) {
            notificationService.create(
                    booking.getCustomer().getId(),
                    "Booking được chấp nhận",
                    "Companion đã chấp nhận đơn #" + booking.getId() + ". Bạn có thể chat/call ngay."
            );
        }
        if (status == Booking.Status.REJECTED) {
            walletService.refundForBooking(booking.getCustomer(), booking, booking.getHoldAmount());
            notificationService.create(
                    booking.getCustomer().getId(),
                    "Booking bị từ chối",
                    "Companion đã từ chối đơn #" + booking.getId() + ". Bạn hãy đặt lại với companion khác."
            );
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
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt lịch"));
        if (!booking.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("Bạn không có quyền thực hiện thao tác này");
        }
        if (booking.getStatus() != Booking.Status.ACCEPTED) {
            throw new RuntimeException("Đơn không ở trạng thái ACCEPTED");
        }
        booking.setCheckInLatitude(lat);
        booking.setCheckInLongitude(lng);
        booking.setStartedAt(LocalDateTime.now());
        booking.setStatus(Booking.Status.IN_PROGRESS);
        return bookingRepository.save(booking);
    }

    public Booking checkOut(Long userId, Long bookingId, Double lat, Double lng) {
        Companion companion = getCompanionByUserId(userId);
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt lịch"));
        if (!booking.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("Bạn không có quyền thực hiện thao tác này");
        }
        if (booking.getStatus() != Booking.Status.IN_PROGRESS) {
            throw new RuntimeException("Đơn không ở trạng thái IN_PROGRESS");
        }
        booking.setCheckOutLatitude(lat);
        booking.setCheckOutLongitude(lng);
        booking.setCompletedAt(LocalDateTime.now());
        booking.setLiveLatitude(null);
        booking.setLiveLongitude(null);
        booking.setLiveLocationAt(null);
        booking.setLiveLocationRole(null);
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

    public Booking triggerSos(Long userId, Long bookingId, String note, Double lat, Double lng) {
        Companion companion = getCompanionByUserId(userId);
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt lịch"));
        if (!booking.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("Bạn không có quyền thực hiện thao tác này");
        }
        if (booking.getStatus() != Booking.Status.ACCEPTED && booking.getStatus() != Booking.Status.IN_PROGRESS) {
            throw new RuntimeException("Chỉ kích hoạt SOS khi đơn đang ACCEPTED hoặc IN_PROGRESS");
        }
        booking.setSosTriggered(true);
        booking.setSosNote(note);
        booking.setCheckInLatitude(lat);
        booking.setCheckInLongitude(lng);
        String noteTail = note == null || note.isBlank() ? "" : (" Chi tiết: " + note.trim());
        notificationService.create(
                booking.getCustomer().getId(),
                "Cảnh báo SOS từ companion",
                "Companion đã kích hoạt SOS cho đơn #" + booking.getId() + ". Vui lòng giữ liên lạc ngay." + noteTail
        );
        userRepository.findByRole(User.Role.ADMIN).forEach(admin -> notificationService.create(
                admin.getId(),
                "SOS KHẨN CẤP",
                "Companion #" + companion.getId() + " đã kích hoạt SOS tại đơn #" + booking.getId() + noteTail
        ));
        return bookingRepository.save(booking);
    }

    public Booking rateUser(Long userId, Long bookingId, Integer rating, String review) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new RuntimeException("Điểm đánh giá phải trong khoảng 1-5");
        }
        Companion companion = getCompanionByUserId(userId);
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt lịch"));
        if (!booking.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("Bạn không có quyền thực hiện thao tác này");
        }
        if (booking.getStatus() != Booking.Status.COMPLETED) {
            throw new RuntimeException("Chỉ đánh giá được đơn đã hoàn tất");
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

    public List<ServicePrice> getServicePricesByCompanionId(Long companionId) {
        companionRepository.findById(companionId).orElseThrow(() -> new RuntimeException("Không tìm thấy companion"));
        return servicePriceRepository.findByCompanionIdOrderByIdDesc(companionId);
    }

    public ServicePrice addServicePrice(Long userId, String serviceName, BigDecimal pricePerHour, String description) {
        if (pricePerHour == null || pricePerHour.signum() <= 0) {
            throw new RuntimeException("Giá phải lớn hơn 0");
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
        ServicePrice item = servicePriceRepository.findById(priceId).orElseThrow(() -> new RuntimeException("Không tìm thấy mục giá"));
        if (!item.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("Bạn không có quyền thực hiện thao tác này");
        }
        servicePriceRepository.delete(item);
    }

    public List<Withdrawal> getWithdrawals(Long userId) {
        Companion companion = getCompanionByUserId(userId);
        return withdrawalRepository.findByCompanionIdOrderByCreatedAtDesc(companion.getId());
    }

    public Map<String, String> getPayoutBankAccount(Long userId) {
        Companion companion = getCompanionByUserId(userId);
        Map<String, String> data = new HashMap<>();
        data.put("bankName", companion.getPayoutBankName() == null ? "" : companion.getPayoutBankName());
        data.put("bankAccountNumber", companion.getPayoutBankAccountNumber() == null ? "" : companion.getPayoutBankAccountNumber());
        data.put("accountHolderName", companion.getPayoutAccountHolderName() == null ? "" : companion.getPayoutAccountHolderName());
        return data;
    }

    public Map<String, String> updatePayoutBankAccount(Long userId, String bankName, String bankAccountNumber, String accountHolderName) {
        if (bankName == null || bankName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên ngân hàng là bắt buộc");
        }
        if (bankAccountNumber == null || bankAccountNumber.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tài khoản ngân hàng là bắt buộc");
        }
        if (accountHolderName == null || accountHolderName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên chủ tài khoản là bắt buộc");
        }
        Companion companion = getCompanionByUserId(userId);
        companion.setPayoutBankName(bankName.trim());
        companion.setPayoutBankAccountNumber(bankAccountNumber.trim());
        companion.setPayoutAccountHolderName(accountHolderName.trim());
        companionRepository.save(companion);
        return getPayoutBankAccount(userId);
    }

    public Withdrawal createWithdrawal(Long userId, BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền rút phải lớn hơn 0");
        }
        Companion companion = getCompanionByUserId(userId);
        if (companion.getPayoutBankName() == null || companion.getPayoutBankName().isBlank()
                || companion.getPayoutBankAccountNumber() == null || companion.getPayoutBankAccountNumber().isBlank()
                || companion.getPayoutAccountHolderName() == null || companion.getPayoutAccountHolderName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng thiết lập tài khoản ngân hàng trước khi rút tiền");
        }
        BigDecimal available = transactionRepository.sumCompletedIncomeByCompanionId(companion.getId())
                .subtract(withdrawalRepository.sumLockedAmountByCompanionId(companion.getId()));
        if (available.signum() < 0) {
            available = BigDecimal.ZERO;
        }
        if (amount.compareTo(available) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số dư khả dụng không đủ");
        }
        Withdrawal withdrawal = new Withdrawal();
        withdrawal.setCompanion(companion);
        withdrawal.setAmount(amount);
        withdrawal.setBankName(companion.getPayoutBankName());
        withdrawal.setBankAccountNumber(companion.getPayoutBankAccountNumber());
        withdrawal.setAccountHolderName(companion.getPayoutAccountHolderName());
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy câu hỏi tư vấn"));
        if (!consultation.getCompanion().getId().equals(companion.getId())) {
            throw new RuntimeException("Bạn không có quyền trả lời câu hỏi tư vấn này");
        }
        consultation.setAnswer(answer);
        consultation.setStatus(Consultation.Status.ANSWERED);
        consultation.setAnsweredAt(LocalDateTime.now());
        return consultationRepository.save(consultation);
    }

    public Consultation createConsultation(Long customerId, Long companionId, String question) {
        User customer = userRepository.findById(customerId).orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng"));
        Companion companion = companionRepository.findById(companionId).orElseThrow(() -> new RuntimeException("Không tìm thấy companion"));

        Consultation consultation = new Consultation();
        consultation.setCustomer(customer);
        consultation.setCompanion(companion);
        consultation.setQuestion(question);
        consultation.setStatus(Consultation.Status.PENDING);
        return consultationRepository.save(consultation);
    }
}
