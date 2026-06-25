package com.theisle.companion.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.util.List;

public record ServerDto(
        String slug,
        String name,
        BigDecimal growthMultiplier,
        String rules,
        JsonNode branding,
        String status,
        List<AllowedDinoDto> allowedDinos
) {
    public record AllowedDinoDto(int id, String name, String diet, String tier) {}
}
