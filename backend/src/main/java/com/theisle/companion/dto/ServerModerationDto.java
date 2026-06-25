package com.theisle.companion.dto;

/** Vista de moderacion de un servidor para el admin de plataforma. */
public record ServerModerationDto(
        String id,
        String slug,
        String name,
        String status,
        String ownerUsername,
        String discordGuildId,
        String discordGuildName,
        String discordInviteUrl,
        String createdAt,
        String reviewedAt
) {}
