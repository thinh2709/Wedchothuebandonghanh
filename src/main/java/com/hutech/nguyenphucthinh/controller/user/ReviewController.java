package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.model.Review;
import com.hutech.nguyenphucthinh.service.user.ReviewService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    @Autowired
    private ReviewService reviewService;

    @GetMapping("/me")
    public List<Review> getMyReviews(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }
        return reviewService.getMyReviews(userId);
    }

    @PostMapping
    public Review createReview(@RequestBody Map<String, Object> request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Please login first");
        }

        Number bookingId = (Number) request.get("bookingId");
        Number rating = (Number) request.get("rating");
        String comment = (String) request.getOrDefault("comment", "");

        if (bookingId == null || rating == null) {
            throw new RuntimeException("bookingId and rating are required");
        }

        return reviewService.createReview(userId, bookingId.longValue(), rating.intValue(), comment);
    }
}
