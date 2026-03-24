package com.hutech.nguyenphucthinh.repository;

import com.hutech.nguyenphucthinh.model.CompanionAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompanionAvailabilityRepository extends JpaRepository<CompanionAvailability, Long> {
    List<CompanionAvailability> findByCompanionIdOrderByStartTimeAsc(Long companionId);
}
