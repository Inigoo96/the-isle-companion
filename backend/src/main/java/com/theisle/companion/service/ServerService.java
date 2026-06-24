package com.theisle.companion.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theisle.companion.domain.entity.Account;
import com.theisle.companion.domain.entity.Dino;
import com.theisle.companion.domain.entity.Server;
import com.theisle.companion.domain.entity.ServerAllowedDino;
import com.theisle.companion.domain.enums.AccountStatus;
import com.theisle.companion.domain.repository.AccountRepository;
import com.theisle.companion.domain.repository.DinoRepository;
import com.theisle.companion.domain.repository.ServerAllowedDinoRepository;
import com.theisle.companion.domain.repository.ServerRepository;
import com.theisle.companion.dto.ServerDto;
import com.theisle.companion.dto.ServerRequest;
import com.theisle.companion.dto.ServerSummaryDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Value;
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
    private final AccountRepository accountRepo;
    private final DinoRepository dinoRepo;
    private final ObjectMapper objectMapper;
    private final String superAdminSteamId;

    @PersistenceContext
    private EntityManager em;

    public ServerService(ServerRepository serverRepo,
                         ServerAllowedDinoRepository allowedDinoRepo,
                         AccountRepository accountRepo,
                         DinoRepository dinoRepo,
                         ObjectMapper objectMapper,
                         @Value("${app.super-admin-steam-id}") String superAdminSteamId) {
        this.serverRepo        = serverRepo;
        this.allowedDinoRepo   = allowedDinoRepo;
        this.accountRepo       = accountRepo;
        this.dinoRepo          = dinoRepo;
        this.objectMapper      = objectMapper;
        this.superAdminSteamId = superAdminSteamId;
    }

    private void requireActive(String steamId) {
        if (superAdminSteamId.equals(steamId)) return;
        accountRepo.findBySteamId(steamId).ifPresent(a -> {
            if (a.getStatus() != AccountStatus.ACTIVE) {
                throw new AccessDeniedException("Account not approved to manage servers");
            }
        });
    }

    public ServerDto getBySlug(String slug) {
        Server server = serverRepo.findBySlugWithDinos(slug)
                .orElseThrow(() -> new EntityNotFoundException("Server not found: " + slug));
        return toDto(server);
    }

    public List<ServerSummaryDto> listAll() {
        return serverRepo.findAllByOrderByNameAsc().stream()
                .map(s -> new ServerSummaryDto(s.getSlug(), s.getName(), s.getGrowthMultiplier()))
                .toList();
    }

    public List<ServerDto> listByOwner(String steamId) {
        return serverRepo.findByOwnerSteamId(steamId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ServerDto create(String steamId, ServerRequest req) {
        requireActive(steamId);
        if (serverRepo.existsBySlug(req.slug())) {
            throw new IllegalArgumentException("Slug already in use: " + req.slug());
        }
        Account owner = accountRepo.findBySteamId(steamId)
                .orElseThrow(() -> new EntityNotFoundException("Account not found"));

        Server server = new Server();
        server.setId(UUID.randomUUID());
        server.setOwner(owner);
        server.setSlug(req.slug());
        server.setName(req.name());
        server.setGrowthMultiplier(req.growthMultiplier());
        server.setRules(req.rules());
        server.setBranding("{}");
        OffsetDateTime now = OffsetDateTime.now();
        server.setCreatedAt(now);
        server.setUpdatedAt(now);

        serverRepo.saveAndFlush(server);
        syncAllowedDinos(server, req.allowedDinoIds());
        return toDto(server);
    }

    @Transactional
    public ServerDto update(String steamId, String slug, ServerRequest req) {
        requireActive(steamId);
        Server server = serverRepo.findBySlugAndOwnerWithDinos(slug, steamId)
                .orElseThrow(() -> new EntityNotFoundException("Server not found: " + slug));

        server.setName(req.name());
        server.setGrowthMultiplier(req.growthMultiplier());
        server.setRules(req.rules());
        server.setUpdatedAt(OffsetDateTime.now());

        syncAllowedDinos(server, req.allowedDinoIds());
        return toDto(server);
    }

    @Transactional
    public void delete(String steamId, String slug) {
        requireActive(steamId);
        Server server = serverRepo.findBySlugAndOwnerWithDinos(slug, steamId)
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
