package com.theisle.companion.domain.entity;

import com.theisle.companion.domain.entity.id.DinoMutationId;
import com.theisle.companion.domain.enums.RecommendationTag;
import jakarta.persistence.*;

@Entity
@Table(name = "dino_mutations")
public class DinoMutation {

    @EmbeddedId
    private DinoMutationId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("dinoId")
    @JoinColumn(name = "dino_id")
    private Dino dino;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("mutationId")
    @JoinColumn(name = "mutation_id")
    private Mutation mutation;

    @Column(nullable = false)
    private Short priority;

    private RecommendationTag tag;

    public DinoMutationId getId() { return id; }
    public Dino getDino() { return dino; }
    public Mutation getMutation() { return mutation; }
    public Short getPriority() { return priority; }
    public RecommendationTag getTag() { return tag; }
}
