package com.theisle.companion.controller;

import com.theisle.companion.domain.enums.AccountStatus;
import com.theisle.companion.dto.AccountSummaryDto;
import com.theisle.companion.service.SuperAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    public SuperAdminController(SuperAdminService superAdminService) {
        this.superAdminService = superAdminService;
    }

    @GetMapping("/accounts")
    public ResponseEntity<List<AccountSummaryDto>> listAccounts(Authentication auth) {
        if (!superAdminService.isSuperAdmin((String) auth.getPrincipal())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(superAdminService.listAccounts());
    }

    @PutMapping("/accounts/{steamId}/status")
    public ResponseEntity<Void> updateStatus(Authentication auth,
                                             @PathVariable String steamId,
                                             @RequestBody Map<String, String> body) {
        if (!superAdminService.isSuperAdmin((String) auth.getPrincipal())) {
            return ResponseEntity.status(403).build();
        }
        AccountStatus newStatus;
        try {
            newStatus = AccountStatus.valueOf(body.get("status"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        superAdminService.updateStatus(steamId, newStatus);
        return ResponseEntity.noContent().build();
    }
}
