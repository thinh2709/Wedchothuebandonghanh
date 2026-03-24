package com.hutech.nguyenphucthinh.repository;

import com.hutech.nguyenphucthinh.model.Companion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CompanionRepository extends JpaRepository<Companion, Long> {
    List<Companion> findByStatus(Companion.Status status);
    Optional<Companion> findByUserId(Long userId);
}
