package com.hutech.nguyenphucthinh.repository;

import com.hutech.nguyenphucthinh.model.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    List<Consultation> findByCompanionIdOrderByCreatedAtDesc(Long companionId);
    List<Consultation> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    long countByCompanionId(Long companionId);
    long countByCompanionIdAndStatus(Long companionId, Consultation.Status status);
}
