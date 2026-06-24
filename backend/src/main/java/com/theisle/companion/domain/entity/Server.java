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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private Account owner;

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

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "server", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<ServerAllowedDino> allowedDinos = new ArrayList<>();

    public UUID getId() { return id; }
    public Account getOwner() { return owner; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public BigDecimal getGrowthMultiplier() { return growthMultiplier; }
    public String getRules() { return rules; }
    public String getBranding() { return branding; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public List<ServerAllowedDino> getAllowedDinos() { return allowedDinos; }
}
