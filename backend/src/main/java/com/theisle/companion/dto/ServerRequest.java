package com.theisle.companion.dto;

import java.math.BigDecimal;
import java.util.List;

public record ServerRequest(
        String slug,
        String name,
        BigDecimal growthMultiplier,
        String rules,
        List<Integer> allowedDinoIds
) {}
