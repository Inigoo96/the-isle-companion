package com.theisle.companion.domain.entity.id;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class DinoMutationId implements Serializable {

    @Column(name = "dino_id")
    private Integer dinoId;

    @Column(name = "mutation_id")
    private Integer mutationId;

    public DinoMutationId() {}
    public DinoMutationId(Integer dinoId, Integer mutationId) { this.dinoId = dinoId; this.mutationId = mutationId; }

    public Integer getDinoId() { return dinoId; }
    public Integer getMutationId() { return mutationId; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DinoMutationId that)) return false;
        return Objects.equals(dinoId, that.dinoId) && Objects.equals(mutationId, that.mutationId);
    }
    @Override public int hashCode() { return Objects.hash(dinoId, mutationId); }
}
