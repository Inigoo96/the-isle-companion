package com.theisle.companion.dto;

/** Vista de moderacion de un admin (identidad Discord) para el admin de plataforma. */
public record AdminModerationDto(
        String id,
        String discordUserId,
        String username,
        String avatarUrl,
        String status,
        long serverCount,
        String createdAt,
        String lastLoginAt,
        String reviewedAt
) {}
