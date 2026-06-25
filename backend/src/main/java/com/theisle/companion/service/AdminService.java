package com.theisle.companion.service;

import com.theisle.companion.domain.entity.Admin;
import com.theisle.companion.domain.repository.AdminRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Identidad del panel por Discord. El login crea o actualiza el admin a partir
 * del perfil de Discord y registra el ultimo acceso.
 */
@Service
public class AdminService {

    private final AdminRepository adminRepo;

    public AdminService(AdminRepository adminRepo) {
        this.adminRepo = adminRepo;
    }

    @Transactional
    public Admin findOrCreate(String discordUserId, String username, String avatarUrl) {
        OffsetDateTime now = OffsetDateTime.now();
        return adminRepo.findByDiscordUserId(discordUserId)
                .map(a -> {
                    a.setUsername(username);
                    a.setAvatarUrl(avatarUrl);
                    a.setLastLoginAt(now);
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
                    return adminRepo.save(a);
                });
    }
}
