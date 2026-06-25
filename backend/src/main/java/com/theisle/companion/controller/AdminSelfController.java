package com.theisle.companion.controller;

import com.theisle.companion.domain.entity.Admin;
import com.theisle.companion.domain.repository.AdminRepository;
import com.theisle.companion.dto.AdminProfileDto;
import com.theisle.companion.dto.GuildDto;
import com.theisle.companion.service.AdminService;
import com.theisle.companion.service.EligibleGuildService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Endpoints "sobre mi" del admin autenticado (identidad Discord): su perfil y
 * sus guilds elegibles. Cualquier ROLE_ADMIN; no requieren ser admin de plataforma.
 */
@RestController
@RequestMapping("/admin")
public class AdminSelfController {

    private final AdminRepository adminRepo;
    private final AdminService adminService;
    private final EligibleGuildService eligibleGuilds;

    public AdminSelfController(AdminRepository adminRepo,
                              AdminService adminService,
                              EligibleGuildService eligibleGuilds) {
        this.adminRepo      = adminRepo;
        this.adminService   = adminService;
        this.eligibleGuilds = eligibleGuilds;
    }

    @GetMapping("/me")
    public ResponseEntity<AdminProfileDto> me(Authentication auth) {
        String discordUserId = (String) auth.getPrincipal();
        Admin admin = adminRepo.findByDiscordUserId(discordUserId)
                .orElseThrow(() -> new EntityNotFoundException("Admin not found"));
        return ResponseEntity.ok(new AdminProfileDto(
                admin.getDiscordUserId(),
                admin.getUsername(),
                admin.getAvatarUrl(),
                admin.getStatus() != null ? admin.getStatus().name().toLowerCase() : null,
                adminService.isPlatformAdmin(discordUserId)
        ));
    }

    @GetMapping("/guilds")
    public ResponseEntity<List<GuildDto>> myEligibleGuilds(Authentication auth) {
        String discordUserId = (String) auth.getPrincipal();
        List<GuildDto> guilds = eligibleGuilds.list(discordUserId).stream()
                .map(g -> new GuildDto(g.id(), g.name(), g.iconUrl()))
                .toList();
        return ResponseEntity.ok(guilds);
    }
}
