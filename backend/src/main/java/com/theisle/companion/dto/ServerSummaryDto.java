package com.theisle.companion.dto;

import java.math.BigDecimal;

public record ServerSummaryDto(String slug, String name, BigDecimal growthMultiplier) {}
