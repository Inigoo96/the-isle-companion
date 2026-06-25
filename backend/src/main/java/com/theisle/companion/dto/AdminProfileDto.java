package com.theisle.companion.dto;

/** Perfil del admin del panel (identidad Discord) + si es admin de plataforma. */
public record AdminProfileDto(
        String discordUserId,
        String username,
        String avatarUrl,
        String status,
        boolean platformAdmin
) {}
