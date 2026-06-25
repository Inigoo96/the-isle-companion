package com.theisle.companion.service;

import com.theisle.companion.service.DiscordOAuthService.DiscordGuild;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Cache en memoria de los guilds elegibles por admin, poblada en cada login.
 *
 * El token de Discord NO se persiste: solo guardamos el set de guilds ya
 * verificado (owner o ADMINISTRATOR). Tiene TTL corto; si el backend se
 * reinicia o caduca, el admin vuelve a loguearse y se repuebla. Es la fuente
 * de verdad para validar el alta de un servidor: nunca confiamos en el
 * guild_id que mande el frontend sin contrastarlo aqui.
 */
@Service
public class EligibleGuildService {

    private static final long TTL_MS = 30 * 60 * 1000; // 30 minutos

    private record Entry(List<DiscordGuild> guilds, long expiresAt) {}

    private final Map<String, Entry> byAdmin = new ConcurrentHashMap<>();

    public void store(String discordUserId, List<DiscordGuild> guilds) {
        byAdmin.put(discordUserId, new Entry(guilds, System.currentTimeMillis() + TTL_MS));
    }

    public List<DiscordGuild> list(String discordUserId) {
        Entry entry = byAdmin.get(discordUserId);
        if (entry == null) return List.of();
        if (entry.expiresAt() < System.currentTimeMillis()) {
            byAdmin.remove(discordUserId);
            return List.of();
        }
        return entry.guilds();
    }

    /** Devuelve el guild verificado si el admin es elegible para el; vacio si no. */
    public Optional<DiscordGuild> findVerified(String discordUserId, String guildId) {
        if (guildId == null) return Optional.empty();
        return list(discordUserId).stream()
                .filter(g -> guildId.equals(g.id()))
                .findFirst();
    }
}
