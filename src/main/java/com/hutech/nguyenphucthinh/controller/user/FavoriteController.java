package com.hutech.nguyenphucthinh.controller.user;

import com.hutech.nguyenphucthinh.model.Favorite;
import com.hutech.nguyenphucthinh.service.user.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {
    @Autowired
    private FavoriteService favoriteService;

    @PostMapping("/{customerId}/{companionId}")
    public String addToFavorites(@PathVariable Long customerId, @PathVariable Long companionId) {
        favoriteService.addToFavorites(customerId, companionId);
        return "Added to favorites";
    }

    @GetMapping("/{customerId}")
    public List<Favorite> getFavoritesByCustomer(@PathVariable Long customerId) {
        return favoriteService.getFavoritesByCustomer(customerId);
    }
}
