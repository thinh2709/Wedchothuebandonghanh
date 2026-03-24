package com.hutech.nguyenphucthinh.service.admin;

import com.hutech.nguyenphucthinh.model.Companion;
import com.hutech.nguyenphucthinh.repository.CompanionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AdminService {
    @Autowired
    private CompanionRepository companionRepository;

    public List<Companion> getPendingCompanions() {
        return companionRepository.findByStatus(Companion.Status.PENDING);
    }

    public Companion approveCompanion(Long id) {
        Companion companion = companionRepository.findById(id).orElseThrow();
        companion.setStatus(Companion.Status.APPROVED);
        return companionRepository.save(companion);
    }

    public Companion rejectCompanion(Long id) {
        Companion companion = companionRepository.findById(id).orElseThrow();
        companion.setStatus(Companion.Status.REJECTED);
        return companionRepository.save(companion);
    }
}
