package com.theisle.companion.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theisle.companion.domain.entity.Server;
import com.theisle.companion.domain.repository.ServerRepository;
import com.theisle.companion.dto.ServerDto;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ServerService {

    private final ServerRepository serverRepo;
    private final ObjectMapper objectMapper;

    public ServerService(ServerRepository serverRepo, ObjectMapper objectMapper) {
        this.serverRepo = serverRepo;
        this.objectMapper = objectMapper;
    }

    public ServerDto getBySlug(String slug) {
        Server server = serverRepo.findBySlugWithDinos(slug)
                .orElseThrow(() -> new EntityNotFoundException("Server not found: " + slug));
        return toDto(server);
    }

    private ServerDto toDto(Server s) {
        var allowedDinos = s.getAllowedDinos().stream()
                .map(ad -> new ServerDto.AllowedDinoDto(
                        ad.getDino().getId(),
                        ad.getDino().getName(),
                        ad.getDino().getDiet().name().toLowerCase(),
                        ad.getDino().getTier().name().toLowerCase()
                ))
                .sorted((a, b) -> a.name().compareTo(b.name()))
                .toList();

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
