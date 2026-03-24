package com.hutech.nguyenphucthinh.repository;

import com.hutech.nguyenphucthinh.model.ServicePrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServicePriceRepository extends JpaRepository<ServicePrice, Long> {
    List<ServicePrice> findByCompanionIdOrderByIdDesc(Long companionId);
}
