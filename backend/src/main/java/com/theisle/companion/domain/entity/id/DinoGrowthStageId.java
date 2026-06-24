package com.theisle.companion.domain.entity.id;

import com.theisle.companion.domain.converter.GrowthStageConverter;
import com.theisle.companion.domain.enums.GrowthStage;
import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class DinoGrowthStageId implements Serializable {

    @Column(name = "dino_id")
    private Integer dinoId;

    @Convert(converter = GrowthStageConverter.class)
    @Column(name = "stage")
    private GrowthStage stage;

    public DinoGrowthStageId() {}
    public DinoGrowthStageId(Integer dinoId, GrowthStage stage) { this.dinoId = dinoId; this.stage = stage; }

    public Integer getDinoId() { return dinoId; }
    public GrowthStage getStage() { return stage; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DinoGrowthStageId that)) return false;
        return Objects.equals(dinoId, that.dinoId) && stage == that.stage;
    }
    @Override public int hashCode() { return Objects.hash(dinoId, stage); }
}
