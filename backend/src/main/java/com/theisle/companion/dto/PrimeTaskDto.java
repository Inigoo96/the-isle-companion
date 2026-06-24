package com.theisle.companion.dto;

public record PrimeTaskDto(
        int id,
        String key,
        String name,
        String category,
        String description,
        boolean defaultActive,
        int sortOrder
) {}
