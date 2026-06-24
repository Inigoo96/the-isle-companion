package com.theisle.companion.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record ZoneDto(
        int id,
        String name,
        String category,
        String shape,
        JsonNode geometry
) {}
