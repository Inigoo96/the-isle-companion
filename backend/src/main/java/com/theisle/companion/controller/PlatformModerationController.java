package com.theisle.companion.controller;

import com.theisle.companion.domain.enums.ServerStatus;
import com.theisle.companion.dto.ServerModerationDto;
import com.theisle.companion.service.ModerationService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Moderacion de plataforma. Gateada por ROLE_ADMIN (SecurityConfig) y, dentro,
 * por la allowlist de admins de plataforma (ModerationService). Los servidores
 * nunca se borran; solo cambian de estado.
 */
@RestController
@RequestMapping("/admin/servers")
public class PlatformModerationController {

    private final ModerationService moderation;

    public PlatformModerationController(ModerationService moderation) {
        this.moderation = moderation;
    }

    @GetMapping
    public ResponseEntity<List<ServerModerationDto>> list(Authentication auth,
                                                          @RequestParam(defaultValue = "pending") String status) {
        ServerStatus parsed;
        try {
            parsed = ServerStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(moderation.listByStatus(caller(auth), parsed));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approve(Authentication auth, @PathVariable String id) {
        return review(auth, id, ServerStatus.ACCEPTED);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> reject(Authentication auth, @PathVariable String id) {
        return review(auth, id, ServerStatus.REJECTED);
    }

    @PostMapping("/{id}/ban")
    public ResponseEntity<Void> ban(Authentication auth, @PathVariable String id) {
        return review(auth, id, ServerStatus.BANNED);
    }

    private ResponseEntity<Void> review(Authentication auth, String id, ServerStatus status) {
        UUID serverId;
        try {
            serverId = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        try {
            moderation.review(caller(auth), serverId, status);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private String caller(Authentication auth) {
        return (String) auth.getPrincipal();
    }
}
