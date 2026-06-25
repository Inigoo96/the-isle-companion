package com.theisle.companion.controller;

import com.theisle.companion.domain.enums.AdminStatus;
import com.theisle.companion.dto.AdminModerationDto;
import com.theisle.companion.service.ModerationService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Moderacion de plataforma sobre ADMINS (la identidad Discord). Gateada por
 * ROLE_ADMIN (SecurityConfig) y, dentro, por la allowlist de admins de plataforma
 * (ModerationService). Los admins nunca se borran; solo cambian de estado.
 */
@RestController
@RequestMapping("/admin/admins")
public class PlatformModerationController {

    private final ModerationService moderation;

    public PlatformModerationController(ModerationService moderation) {
        this.moderation = moderation;
    }

    @GetMapping
    public ResponseEntity<List<AdminModerationDto>> list(Authentication auth,
                                                         @RequestParam(defaultValue = "pending") String status) {
        AdminStatus parsed;
        try {
            parsed = AdminStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(moderation.listByStatus(caller(auth), parsed));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approve(Authentication auth, @PathVariable String id) {
        return review(auth, id, AdminStatus.ACCEPTED);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> reject(Authentication auth, @PathVariable String id) {
        return review(auth, id, AdminStatus.REJECTED);
    }

    @PostMapping("/{id}/ban")
    public ResponseEntity<Void> ban(Authentication auth, @PathVariable String id) {
        return review(auth, id, AdminStatus.BANNED);
    }

    private ResponseEntity<Void> review(Authentication auth, String id, AdminStatus status) {
        UUID adminId;
        try {
            adminId = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        try {
            moderation.review(caller(auth), adminId, status);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            // Transicion de estado no permitida (p.ej. pending -> banned)
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    private String caller(Authentication auth) {
        return (String) auth.getPrincipal();
    }
}
