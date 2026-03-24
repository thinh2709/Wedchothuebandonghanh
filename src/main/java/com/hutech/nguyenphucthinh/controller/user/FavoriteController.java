package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.model.Favorite;
import com.hutech.nguyenphucthinh.service.user.FavoriteService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {
    @Autowired
    private FavoriteService favoriteService;

    @PostMapping("/{companionId}")
    public String addToFavorites(@PathVariable Long companionId, HttpSession session) {
        Long customerId = (Long) session.getAttribute("userId");
        if (customerId == null) {
            throw new RuntimeException("Please login first");
        }
        favoriteService.addToFavorites(customerId, companionId);
        return "Added to favorites";
    }

    @PostMapping("/{customerId}/{companionId}")
    public String addToFavorites(@PathVariable Long customerId, @PathVariable Long companionId) {
        favoriteService.addToFavorites(customerId, companionId);
        return "Added to favorites";
    }

    @GetMapping("/me")
    public List<Favorite> getMyFavorites(HttpSession session) {
        Long customerId = (Long) session.getAttribute("userId");
        if (customerId == null) {
            throw new RuntimeException("Please login first");
        }
        return favoriteService.getFavoritesByCustomer(customerId);
    }

    @GetMapping("/{customerId}")
    public List<Favorite> getFavoritesByCustomer(@PathVariable Long customerId) {
        return favoriteService.getFavoritesByCustomer(customerId);
    }

    @DeleteMapping("/{companionId}")
    public String removeFavorite(@PathVariable Long companionId, HttpSession session) {
        Long customerId = (Long) session.getAttribute("userId");
        if (customerId == null) {
            throw new RuntimeException("Please login first");
        }
        favoriteService.removeFavorite(customerId, companionId);
        return "Removed from favorites";
    }
}
