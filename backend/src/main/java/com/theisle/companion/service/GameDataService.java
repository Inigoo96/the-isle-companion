package com.theisle.companion.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theisle.companion.domain.entity.*;
import com.theisle.companion.domain.repository.*;
import com.theisle.companion.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class GameDataService {

    private final DinoRepository dinoRepo;
    private final MutationRepository mutationRepo;
    private final ZoneRepository zoneRepo;
    private final PrimeTaskRepository primeTaskRepo;
    private final ObjectMapper objectMapper;

    public GameDataService(DinoRepository dinoRepo, MutationRepository mutationRepo,
                           ZoneRepository zoneRepo, PrimeTaskRepository primeTaskRepo,
                           ObjectMapper objectMapper) {
        this.dinoRepo = dinoRepo;
        this.mutationRepo = mutationRepo;
        this.zoneRepo = zoneRepo;
        this.primeTaskRepo = primeTaskRepo;
        this.objectMapper = objectMapper;
    }

    public List<DinoDto> getDinos() {
        return dinoRepo.findAllByOrderByNameAsc().stream().map(this::toDto).toList();
    }

    public List<MutationDto> getMutations() {
        return mutationRepo.findAllByOrderByNameAsc().stream().map(this::toDto).toList();
    }

    public List<ZoneDto> getZones() {
        return zoneRepo.findAllByOrderByCategoryAscNameAsc().stream().map(this::toDto).toList();
    }

    public List<PrimeTaskDto> getPrimeTasks() {
        return primeTaskRepo.findAllByOrderBySortOrderAsc().stream().map(this::toDto).toList();
    }

    private DinoDto toDto(Dino d) {
        return new DinoDto(
                d.getId(),
                d.getName(),
                d.getDiet().name().toLowerCase(),
                d.getTier().name().toLowerCase(),
                d.getAbility(),
                d.getStats().stream().map(s -> toDto(s)).toList(),
                d.getGrowthStages().stream().map(g -> toDto(g)).toList(),
                d.getMutations().stream().map(dm -> toDto(dm)).toList()
        );
    }

    private DinoStatDto toDto(DinoStat s) {
        return new DinoStatDto(
                s.getId().getStage().name().toLowerCase(),
                s.getWeight(),
                s.getSpeed(),
                s.getBiteForce()
        );
    }

    private DinoGrowthStageDto toDto(DinoGrowthStage g) {
        return new DinoGrowthStageDto(
                g.getId().getStage().name().toLowerCase(),
                g.getOrdinal(),
                g.getMinutes()
        );
    }

    private DinoMutationDto toDto(DinoMutation dm) {
        return new DinoMutationDto(
                dm.getMutation().getId(),
                dm.getMutation().getName(),
                dm.getMutation().getCategory().name().toLowerCase(),
                dm.getPriority(),
                dm.getTag() == null ? null : dm.getTag().name().toLowerCase()
        );
    }

    private MutationDto toDto(Mutation m) {
        return new MutationDto(m.getId(), m.getName(), m.getEffect(),
                m.getCategory().name().toLowerCase());
    }

    private ZoneDto toDto(Zone z) {
        return new ZoneDto(
                z.getId(),
                z.getName(),
                z.getCategory().name().toLowerCase(),
                z.getShape().name().toLowerCase(),
                parseJson(z.getGeometry())
        );
    }

    private PrimeTaskDto toDto(PrimeTask t) {
        return new PrimeTaskDto(
                t.getId(),
                t.getKey(),
                t.getName(),
                t.getCategory().name().toLowerCase(),
                t.getDescription(),
                t.isDefaultActive(),
                t.getSortOrder()
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
