package com.theisle.companion.controller;

import com.theisle.companion.dto.GuildDto;
import com.theisle.companion.service.EligibleGuildService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Guilds de Discord donde el admin autenticado es owner o tiene ADMINISTRATOR.
 * Los sirve desde el cache poblado en el login; si esta vacio (cache caducado o
 * backend reiniciado), el admin debe volver a iniciar sesion.
 */
@RestController
@RequestMapping("/admin/guilds")
public class AdminGuildController {

    private final EligibleGuildService eligibleGuilds;

    public AdminGuildController(EligibleGuildService eligibleGuilds) {
        this.eligibleGuilds = eligibleGuilds;
    }

    @GetMapping
    public ResponseEntity<List<GuildDto>> myEligibleGuilds(Authentication auth) {
        String discordUserId = (String) auth.getPrincipal();
        List<GuildDto> guilds = eligibleGuilds.list(discordUserId).stream()
                .map(g -> new GuildDto(g.id(), g.name(), g.iconUrl()))
                .toList();
        return ResponseEntity.ok(guilds);
    }
}
