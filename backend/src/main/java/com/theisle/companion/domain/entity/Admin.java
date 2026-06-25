package com.theisle.companion.domain.entity;

import com.theisle.companion.domain.enums.AdminStatus;
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

    // Moderacion de plataforma: el admin entra 'pending' y se aprueba/rechaza/banea.
    @Column(nullable = false)
    private AdminStatus status;

    private OffsetDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private Admin reviewedBy;

    public UUID getId() { return id; }
    public String getDiscordUserId() { return discordUserId; }
    public String getUsername() { return username; }
    public String getAvatarUrl() { return avatarUrl; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getLastLoginAt() { return lastLoginAt; }
    public AdminStatus getStatus() { return status; }
    public OffsetDateTime getReviewedAt() { return reviewedAt; }
    public Admin getReviewedBy() { return reviewedBy; }

    public void setId(UUID id) { this.id = id; }
    public void setDiscordUserId(String discordUserId) { this.discordUserId = discordUserId; }
    public void setUsername(String username) { this.username = username; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public void setLastLoginAt(OffsetDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    public void setStatus(AdminStatus status) { this.status = status; }
    public void setReviewedAt(OffsetDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
    public void setReviewedBy(Admin reviewedBy) { this.reviewedBy = reviewedBy; }
}
