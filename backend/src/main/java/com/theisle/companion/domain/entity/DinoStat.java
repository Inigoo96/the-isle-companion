package com.theisle.companion.domain.entity;

import com.theisle.companion.domain.entity.id.DinoStatId;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "dino_stats")
public class DinoStat {

    @EmbeddedId
    private DinoStatId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("dinoId")
    @JoinColumn(name = "dino_id")
    private Dino dino;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal weight;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal speed;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal biteForce;

    public DinoStatId getId() { return id; }
    public Dino getDino() { return dino; }
    public BigDecimal getWeight() { return weight; }
    public BigDecimal getSpeed() { return speed; }
    public BigDecimal getBiteForce() { return biteForce; }
}
