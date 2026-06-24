package com.theisle.companion.domain.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "accounts")
public class Account {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String steamId;

    @Column(length = 96)
    private String displayName;

    @Column(columnDefinition = "text")
    private String avatarUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String prefs;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    private OffsetDateTime lastLoginAt;

    public UUID getId() { return id; }
    public String getSteamId() { return steamId; }
    public String getDisplayName() { return displayName; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getPrefs() { return prefs; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getLastLoginAt() { return lastLoginAt; }
}
