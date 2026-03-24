package com.hutech.nguyenphucthinh.controller.admin;

import com.hutech.nguyenphucthinh.model.Companion;
import com.hutech.nguyenphucthinh.service.admin.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired
    private AdminService adminService;

    @GetMapping("/pending-companions")
    public List<Companion> getPendingCompanions() {
        return adminService.getPendingCompanions();
    }

    @PostMapping("/approve-companion/{id}")
    public Companion approveCompanion(@PathVariable Long id) {
        return adminService.approveCompanion(id);
    }

    @PostMapping("/reject-companion/{id}")
    public Companion rejectCompanion(@PathVariable Long id) {
        return adminService.rejectCompanion(id);
    }
}
