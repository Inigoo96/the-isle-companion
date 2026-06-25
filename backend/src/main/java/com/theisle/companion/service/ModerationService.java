package com.theisle.companion.service;

import com.theisle.companion.domain.entity.Admin;
import com.theisle.companion.domain.entity.Server;
import com.theisle.companion.domain.enums.ServerStatus;
import com.theisle.companion.domain.repository.AdminRepository;
import com.theisle.companion.domain.repository.ServerRepository;
import com.theisle.companion.dto.ServerModerationDto;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Moderacion de plataforma: aprobar/rechazar/banear servidores. Solo los admins
 * de plataforma (allowlist de discord_user_ids) pueden operar. Los servidores
 * nunca se borran; solo cambian de estado.
 */
@Service
@Transactional(readOnly = true)
public class ModerationService {

    private final ServerRepository serverRepo;
    private final AdminRepository adminRepo;
    private final AdminService adminService;

    public ModerationService(ServerRepository serverRepo,
                             AdminRepository adminRepo,
                             AdminService adminService) {
        this.serverRepo   = serverRepo;
        this.adminRepo    = adminRepo;
        this.adminService = adminService;
    }

    public List<ServerModerationDto> listByStatus(String callerDiscordId, ServerStatus status) {
        requirePlatformAdmin(callerDiscordId);
        return serverRepo.findByStatusWithOwner(status).stream()
                .map(ModerationService::toDto)
                .toList();
    }

    @Transactional
    public void review(String callerDiscordId, UUID serverId, ServerStatus newStatus) {
        requirePlatformAdmin(callerDiscordId);
        Admin reviewer = adminRepo.findByDiscordUserId(callerDiscordId)
                .orElseThrow(() -> new EntityNotFoundException("Admin not found"));
        Server server = serverRepo.findById(serverId)
                .orElseThrow(() -> new EntityNotFoundException("Server not found: " + serverId));

        OffsetDateTime now = OffsetDateTime.now();
        server.setStatus(newStatus);
        server.setReviewedAt(now);
        server.setReviewedBy(reviewer);
        server.setUpdatedAt(now);
    }

    private void requirePlatformAdmin(String discordUserId) {
        if (!adminService.isPlatformAdmin(discordUserId)) {
            throw new AccessDeniedException("Not a platform admin");
        }
    }

    private static ServerModerationDto toDto(Server s) {
        return new ServerModerationDto(
                s.getId().toString(),
                s.getSlug(),
                s.getName(),
                s.getStatus() != null ? s.getStatus().name().toLowerCase() : null,
                s.getOwner() != null ? s.getOwner().getUsername() : null,
                s.getDiscordGuildId(),
                s.getDiscordGuildName(),
                s.getDiscordInviteUrl(),
                s.getCreatedAt() != null ? s.getCreatedAt().toString() : null,
                s.getReviewedAt() != null ? s.getReviewedAt().toString() : null
        );
    }
}
