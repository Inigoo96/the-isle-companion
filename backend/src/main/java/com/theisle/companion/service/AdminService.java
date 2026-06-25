package com.theisle.companion.service;

import com.theisle.companion.domain.entity.Admin;
import com.theisle.companion.domain.enums.AdminStatus;
import com.theisle.companion.domain.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Identidad del panel por Discord. El login crea o actualiza el admin a partir
 * del perfil de Discord y registra el ultimo acceso.
 */
@Service
public class AdminService {

    private final AdminRepository adminRepo;
    /** Allowlist de discord_user_ids con permisos de moderacion de plataforma. */
    private final Set<String> platformAdmins;

    public AdminService(AdminRepository adminRepo,
                        @Value("${app.platform-admins:}") String platformAdminsCsv) {
        this.adminRepo = adminRepo;
        this.platformAdmins = Arrays.stream(platformAdminsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    public boolean isPlatformAdmin(String discordUserId) {
        return discordUserId != null && platformAdmins.contains(discordUserId);
    }

    @Transactional
    public Admin findOrCreate(String discordUserId, String username, String avatarUrl) {
        OffsetDateTime now = OffsetDateTime.now();
        boolean platform = isPlatformAdmin(discordUserId);
        return adminRepo.findByDiscordUserId(discordUserId)
                .map(a -> {
                    a.setUsername(username);
                    a.setAvatarUrl(avatarUrl);
                    a.setLastLoginAt(now);
                    // El admin de plataforma siempre va accepted (no se modera a si mismo).
                    if (platform && a.getStatus() != AdminStatus.ACCEPTED) {
                        a.setStatus(AdminStatus.ACCEPTED);
                    }
                    return adminRepo.save(a);
                })
                .orElseGet(() -> {
                    Admin a = new Admin();
                    a.setId(UUID.randomUUID());
                    a.setDiscordUserId(discordUserId);
                    a.setUsername(username);
                    a.setAvatarUrl(avatarUrl);
                    a.setCreatedAt(now);
                    a.setLastLoginAt(now);
                    a.setStatus(platform ? AdminStatus.ACCEPTED : AdminStatus.PENDING);
                    return adminRepo.save(a);
                });
    }
}
