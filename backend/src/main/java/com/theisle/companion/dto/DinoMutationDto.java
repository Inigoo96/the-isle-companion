package com.theisle.companion.dto;

public record DinoMutationDto(
        int mutationId,
        String name,
        String category,
        int priority,
        String tag
) {}
