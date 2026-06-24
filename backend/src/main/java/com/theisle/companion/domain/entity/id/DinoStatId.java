package com.theisle.companion.domain.entity.id;

import com.theisle.companion.domain.converter.StatStageConverter;
import com.theisle.companion.domain.enums.StatStage;
import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class DinoStatId implements Serializable {

    @Column(name = "dino_id")
    private Integer dinoId;

    @Convert(converter = StatStageConverter.class)
    @Column(name = "stage")
    private StatStage stage;

    public DinoStatId() {}
    public DinoStatId(Integer dinoId, StatStage stage) { this.dinoId = dinoId; this.stage = stage; }

    public Integer getDinoId() { return dinoId; }
    public StatStage getStage() { return stage; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DinoStatId that)) return false;
        return Objects.equals(dinoId, that.dinoId) && stage == that.stage;
    }
    @Override public int hashCode() { return Objects.hash(dinoId, stage); }
}
