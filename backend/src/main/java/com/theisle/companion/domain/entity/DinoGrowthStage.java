package com.theisle.companion.domain.entity;

import com.theisle.companion.domain.entity.id.DinoGrowthStageId;
import jakarta.persistence.*;

@Entity
@Table(name = "dino_growth_stages")
public class DinoGrowthStage {

    @EmbeddedId
    private DinoGrowthStageId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("dinoId")
    @JoinColumn(name = "dino_id")
    private Dino dino;

    @Column(nullable = false)
    private Short ordinal;

    @Column(nullable = false)
    private Integer minutes;

    public DinoGrowthStageId getId() { return id; }
    public Dino getDino() { return dino; }
    public Short getOrdinal() { return ordinal; }
    public Integer getMinutes() { return minutes; }

    public void setId(DinoGrowthStageId id) { this.id = id; }
    public void setDino(Dino dino) { this.dino = dino; }
    public void setOrdinal(Short ordinal) { this.ordinal = ordinal; }
    public void setMinutes(Integer minutes) { this.minutes = minutes; }
}
