package com.theisle.companion.dto;

public record MutationDto(
        int id,
        String name,
        String effect,
        String category
) {}
