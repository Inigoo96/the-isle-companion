package com.theisle.companion.domain.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Identidad del panel de administracion, autenticada por Discord OAuth2.
 * Independiente de Account (Steam, jugadores del overlay): son dos identidades
 * separadas que nunca se mezclan.
 */
@Entity
@Table(name = "admins")
public class Admin {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 32)
    private String discordUserId;

    @Column(length = 128)
    private String username;

    @Column(columnDefinition = "text")
    private String avatarUrl;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    private OffsetDateTime lastLoginAt;

    public UUID getId() { return id; }
    public String getDiscordUserId() { return discordUserId; }
    public String getUsername() { return username; }
    public String getAvatarUrl() { return avatarUrl; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getLastLoginAt() { return lastLoginAt; }

    public void setId(UUID id) { this.id = id; }
    public void setDiscordUserId(String discordUserId) { this.discordUserId = discordUserId; }
    public void setUsername(String username) { this.username = username; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public void setLastLoginAt(OffsetDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
}
