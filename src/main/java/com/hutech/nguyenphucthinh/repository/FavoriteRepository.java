package com.hutech.nguyenphucthinh.repository;

import com.hutech.nguyenphucthinh.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    boolean existsByCustomerIdAndCompanionId(Long customerId, Long companionId);
    List<Favorite> findByCustomerId(Long customerId);
}
