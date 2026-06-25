package com.theisle.companion.domain.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "servers")
public class Server {

    @Id
    private UUID id;

    // Owner = identidad Discord del panel (admins), NO una cuenta Steam.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private Admin owner;

    @Column(nullable = false, unique = true, length = 48)
    private String slug;

    @Column(nullable = false, length = 96)
    private String name;

    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal growthMultiplier;

    @Column(columnDefinition = "text")
    private String rules;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String branding;

    // Guild de Discord verificado en el alta (no se persiste el token de Discord).
    @Column(length = 32)
    private String discordGuildId;

    @Column(length = 128)
    private String discordGuildName;

    @Column(columnDefinition = "text")
    private String discordInviteUrl;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "server", fetch = FetchType.LAZY)
    private List<ServerAllowedDino> allowedDinos = new ArrayList<>();

    public UUID getId() { return id; }
    public Admin getOwner() { return owner; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public BigDecimal getGrowthMultiplier() { return growthMultiplier; }
    public String getRules() { return rules; }
    public String getBranding() { return branding; }
    public String getDiscordGuildId() { return discordGuildId; }
    public String getDiscordGuildName() { return discordGuildName; }
    public String getDiscordInviteUrl() { return discordInviteUrl; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public List<ServerAllowedDino> getAllowedDinos() { return allowedDinos; }

    public void setId(UUID id) { this.id = id; }
    public void setOwner(Admin owner) { this.owner = owner; }
    public void setSlug(String slug) { this.slug = slug; }
    public void setName(String name) { this.name = name; }
    public void setGrowthMultiplier(BigDecimal growthMultiplier) { this.growthMultiplier = growthMultiplier; }
    public void setRules(String rules) { this.rules = rules; }
    public void setBranding(String branding) { this.branding = branding; }
    public void setDiscordGuildId(String discordGuildId) { this.discordGuildId = discordGuildId; }
    public void setDiscordGuildName(String discordGuildName) { this.discordGuildName = discordGuildName; }
    public void setDiscordInviteUrl(String discordInviteUrl) { this.discordInviteUrl = discordInviteUrl; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
