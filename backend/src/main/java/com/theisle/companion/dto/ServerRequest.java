package com.theisle.companion.dto;

import java.math.BigDecimal;
import java.util.List;

public record ServerRequest(
        String slug,
        String name,
        BigDecimal growthMultiplier,
        String rules,
        String discordGuildId,   // guild que el admin reclama; se verifica en backend
        String discordInviteUrl, // invitacion publica opcional (no verificada)
        List<Integer> allowedDinoIds
) {}
