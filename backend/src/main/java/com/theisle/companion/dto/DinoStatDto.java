package com.theisle.companion.dto;

import java.math.BigDecimal;

public record DinoStatDto(
        String stage,
        BigDecimal weight,
        BigDecimal speed,
        BigDecimal biteForce
) {}
