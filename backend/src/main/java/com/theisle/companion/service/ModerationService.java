package com.theisle.companion.service;

import com.theisle.companion.domain.entity.Admin;
import com.theisle.companion.domain.enums.AdminStatus;
import com.theisle.companion.domain.repository.AdminRepository;
import com.theisle.companion.domain.repository.ServerRepository;
import com.theisle.companion.dto.AdminModerationDto;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Moderacion de plataforma: aprobar/rechazar/banear ADMINS (la identidad Discord),
 * no servers. Solo los admins de plataforma (allowlist) pueden operar. Los admins
 * nunca se borran; solo cambian de estado.
 */
@Service
@Transactional(readOnly = true)
public class ModerationService {

    /**
     * Transiciones permitidas del ciclo de vida del admin:
     *   pending  -> accepted | rejected
     *   rejected -> accepted        (re-aprobar)
     *   accepted -> banned          (retirar acceso)
     *   banned   -> accepted        (des-banear)
     */
    private static final Map<AdminStatus, Set<AdminStatus>> TRANSITIONS = Map.of(
            AdminStatus.PENDING,  Set.of(AdminStatus.ACCEPTED, AdminStatus.REJECTED),
            AdminStatus.REJECTED, Set.of(AdminStatus.ACCEPTED),
            AdminStatus.ACCEPTED, Set.of(AdminStatus.BANNED),
            AdminStatus.BANNED,   Set.of(AdminStatus.ACCEPTED)
    );

    private final AdminRepository adminRepo;
    private final ServerRepository serverRepo;
    private final AdminService adminService;

    public ModerationService(AdminRepository adminRepo,
                             ServerRepository serverRepo,
                             AdminService adminService) {
        this.adminRepo    = adminRepo;
        this.serverRepo   = serverRepo;
        this.adminService = adminService;
    }

    public List<AdminModerationDto> listByStatus(String callerDiscordId, AdminStatus status) {
        requirePlatformAdmin(callerDiscordId);
        return adminRepo.findByStatusOrderByCreatedAtAsc(status).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void review(String callerDiscordId, UUID adminId, AdminStatus newStatus) {
        requirePlatformAdmin(callerDiscordId);
        Admin reviewer = adminRepo.findByDiscordUserId(callerDiscordId)
                .orElseThrow(() -> new EntityNotFoundException("Reviewer not found"));
        Admin target = adminRepo.findById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Admin not found: " + adminId));

        AdminStatus current = target.getStatus();
        if (current == newStatus) {
            return; // idempotente
        }
        if (!TRANSITIONS.getOrDefault(current, Set.of()).contains(newStatus)) {
            throw new IllegalStateException("Invalid transition: " + current + " -> " + newStatus);
        }

        OffsetDateTime now = OffsetDateTime.now();
        target.setStatus(newStatus);
        target.setReviewedAt(now);
        target.setReviewedBy(reviewer);
    }

    private void requirePlatformAdmin(String discordUserId) {
        if (!adminService.isPlatformAdmin(discordUserId)) {
            throw new AccessDeniedException("Not a platform admin");
        }
    }

    private AdminModerationDto toDto(Admin a) {
        return new AdminModerationDto(
                a.getId().toString(),
                a.getDiscordUserId(),
                a.getUsername(),
                a.getAvatarUrl(),
                a.getStatus() != null ? a.getStatus().name().toLowerCase() : null,
                serverRepo.countByOwnerId(a.getId()),
                a.getCreatedAt()   != null ? a.getCreatedAt().toString()   : null,
                a.getLastLoginAt() != null ? a.getLastLoginAt().toString() : null,
                a.getReviewedAt()  != null ? a.getReviewedAt().toString()  : null
        );
    }
}
