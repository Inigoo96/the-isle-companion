package com.theisle.companion.dto;

import java.util.List;

public record DinoDto(
        int id,
        String name,
        String diet,
        String tier,
        String ability,
        List<DinoStatDto> stats,
        List<DinoGrowthStageDto> growthStages,
        List<DinoMutationDto> mutations
) {}
