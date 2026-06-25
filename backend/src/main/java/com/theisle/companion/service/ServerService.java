package com.theisle.companion.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theisle.companion.domain.entity.Admin;
import com.theisle.companion.domain.entity.Server;
import com.theisle.companion.domain.entity.ServerAllowedDino;
import com.theisle.companion.domain.enums.AdminStatus;
import com.theisle.companion.domain.repository.AdminRepository;
import com.theisle.companion.domain.repository.DinoRepository;
import com.theisle.companion.domain.repository.ServerAllowedDinoRepository;
import com.theisle.companion.domain.repository.ServerRepository;
import com.theisle.companion.dto.ServerDto;
import com.theisle.companion.dto.ServerRequest;
import com.theisle.companion.dto.ServerSummaryDto;
import com.theisle.companion.service.DiscordOAuthService.DiscordGuild;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ServerService {

    private final ServerRepository serverRepo;
    private final ServerAllowedDinoRepository allowedDinoRepo;
    private final AdminRepository adminRepo;
    private final DinoRepository dinoRepo;
    private final EligibleGuildService eligibleGuilds;
    private final ObjectMapper objectMapper;

    @PersistenceContext
    private EntityManager em;

    public ServerService(ServerRepository serverRepo,
                         ServerAllowedDinoRepository allowedDinoRepo,
                         AdminRepository adminRepo,
                         DinoRepository dinoRepo,
                         EligibleGuildService eligibleGuilds,
                         ObjectMapper objectMapper) {
        this.serverRepo      = serverRepo;
        this.allowedDinoRepo = allowedDinoRepo;
        this.adminRepo       = adminRepo;
        this.dinoRepo        = dinoRepo;
        this.eligibleGuilds  = eligibleGuilds;
        this.objectMapper    = objectMapper;
    }

    public ServerDto getBySlug(String slug) {
        // Publico: solo se ven los servers de admins 'accepted'.
        Server server = serverRepo.findBySlugWithDinos(slug)
                .filter(s -> s.getOwner().getStatus() == AdminStatus.ACCEPTED)
                .orElseThrow(() -> new EntityNotFoundException("Server not found: " + slug));
        return toDto(server);
    }

    public List<ServerSummaryDto> listAll() {
        return serverRepo.findByOwnerStatusOrderByNameAsc(AdminStatus.ACCEPTED).stream()
                .map(s -> new ServerSummaryDto(s.getSlug(), s.getName(), s.getGrowthMultiplier()))
                .toList();
    }

    public List<ServerDto> listByOwner(String discordUserId) {
        return serverRepo.findByOwnerDiscordUserId(discordUserId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ServerDto create(String discordUserId, ServerRequest req) {
        if (req.discordGuildId() == null || req.discordGuildId().isBlank()) {
            throw new IllegalArgumentException("discordGuildId is required");
        }
        if (serverRepo.existsBySlug(req.slug())) {
            throw new IllegalArgumentException("Slug already in use: " + req.slug());
        }
        Admin owner = adminRepo.findByDiscordUserId(discordUserId)
                .orElseThrow(() -> new EntityNotFoundException("Admin not found"));
        // Acceso revocado: un admin rechazado o baneado no puede crear servers.
        // Un admin 'pending' SI puede crear (solo que no sera publico hasta aceptarlo).
        if (owner.getStatus() == AdminStatus.REJECTED || owner.getStatus() == AdminStatus.BANNED) {
            throw new AccessDeniedException("Your access has been revoked by the platform");
        }
        // Verificacion de propiedad en el BACKEND: el guild debe estar en el set
        // elegible del admin (owner/ADMINISTRATOR), cacheado en el login. Nunca
        // confiamos en el guild_id que mande el frontend sin contrastarlo.
        DiscordGuild guild = eligibleGuilds.findVerified(discordUserId, req.discordGuildId())
                .orElseThrow(() -> new AccessDeniedException(
                        "Not an owner/admin of the requested Discord guild (or session expired)"));
        if (serverRepo.existsByDiscordGuildId(guild.id())) {
            throw new IllegalArgumentException("Guild already linked to a server: " + guild.id());
        }

        OffsetDateTime now = OffsetDateTime.now();
        Server server = new Server();
        server.setId(UUID.randomUUID());
        server.setOwner(owner);
        server.setSlug(req.slug());
        server.setName(req.name());
        server.setGrowthMultiplier(req.growthMultiplier());
        server.setRules(req.rules());
        server.setBranding("{}");
        server.setDiscordGuildId(guild.id());
        server.setDiscordGuildName(guild.name());
        server.setDiscordInviteUrl(req.discordInviteUrl());
        server.setCreatedAt(now);
        server.setUpdatedAt(now);

        serverRepo.saveAndFlush(server);
        syncAllowedDinos(server, req.allowedDinoIds());
        return toDto(server);
    }

    @Transactional
    public ServerDto update(String discordUserId, String slug, ServerRequest req) {
        Server server = serverRepo.findBySlugAndOwnerWithDinos(slug, discordUserId)
                .orElseThrow(() -> new EntityNotFoundException("Server not found: " + slug));

        server.setName(req.name());
        server.setGrowthMultiplier(req.growthMultiplier());
        server.setRules(req.rules());
        // El guild verificado no se cambia aqui; la invitacion publica si es editable.
        server.setDiscordInviteUrl(req.discordInviteUrl());
        server.setUpdatedAt(OffsetDateTime.now());

        syncAllowedDinos(server, req.allowedDinoIds());
        return toDto(server);
    }

    @Transactional
    public void delete(String discordUserId, String slug) {
        Server server = serverRepo.findBySlugAndOwnerWithDinos(slug, discordUserId)
                .orElseThrow(() -> new EntityNotFoundException("Server not found: " + slug));
        allowedDinoRepo.deleteByServerId(server.getId());
        serverRepo.delete(server);
    }

    private void syncAllowedDinos(Server server, List<Integer> dinoIds) {
        new ArrayList<>(server.getAllowedDinos()).forEach(em::detach);
        server.getAllowedDinos().clear();
        allowedDinoRepo.deleteByServerId(server.getId());

        if (dinoIds != null && !dinoIds.isEmpty() && dinoIds.size() < dinoRepo.count()) {
            List<ServerAllowedDino> entries = dinoRepo.findAllById(dinoIds).stream()
                    .map(d -> new ServerAllowedDino(server, d))
                    .toList();
            allowedDinoRepo.saveAll(entries);
            server.getAllowedDinos().addAll(entries);
        }
        // All dinos selected (or none specified): leave table empty → means "all allowed"
    }

    private ServerDto toDto(Server s) {
        List<ServerDto.AllowedDinoDto> allowedDinos;
        if (s.getAllowedDinos().isEmpty()) {
            // No rows = all dinos are allowed
            allowedDinos = dinoRepo.findAllByOrderByNameAsc().stream()
                    .map(d -> new ServerDto.AllowedDinoDto(
                            d.getId(), d.getName(),
                            d.getDiet().name().toLowerCase(),
                            d.getTier().name().toLowerCase()
                    ))
                    .toList();
        } else {
            allowedDinos = s.getAllowedDinos().stream()
                    .map(ad -> new ServerDto.AllowedDinoDto(
                            ad.getDino().getId(),
                            ad.getDino().getName(),
                            ad.getDino().getDiet().name().toLowerCase(),
                            ad.getDino().getTier().name().toLowerCase()
                    ))
                    .sorted((a, b) -> a.name().compareTo(b.name()))
                    .toList();
        }

        return new ServerDto(
                s.getSlug(),
                s.getName(),
                s.getGrowthMultiplier(),
                s.getRules(),
                parseJson(s.getBranding()),
                s.getDiscordGuildName(),
                s.getDiscordInviteUrl(),
                allowedDinos
        );
    }

    private JsonNode parseJson(String raw) {
        try {
            return objectMapper.readTree(raw);
        } catch (Exception e) {
            return objectMapper.nullNode();
        }
    }
}
