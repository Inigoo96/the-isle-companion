package com.theisle.companion.domain.entity;

import com.theisle.companion.domain.enums.DinoDict;
import com.theisle.companion.domain.enums.DinoTier;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dinos")
public class Dino {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 64)
    private String name;

    @Column(nullable = false)
    private DinoDict diet;

    @Column(nullable = false)
    private DinoTier tier;

    @Column(length = 64)
    private String ability;

    @BatchSize(size = 50)
    @OneToMany(mappedBy = "dino", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<DinoStat> stats = new ArrayList<>();

    @BatchSize(size = 50)
    @OneToMany(mappedBy = "dino", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @OrderBy("ordinal ASC")
    private List<DinoGrowthStage> growthStages = new ArrayList<>();

    @BatchSize(size = 50)
    @OneToMany(mappedBy = "dino", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @OrderBy("priority ASC")
    private List<DinoMutation> mutations = new ArrayList<>();

    public Integer getId() { return id; }
    public String getName() { return name; }
    public DinoDict getDiet() { return diet; }
    public DinoTier getTier() { return tier; }
    public String getAbility() { return ability; }
    public List<DinoStat> getStats() { return stats; }
    public List<DinoGrowthStage> getGrowthStages() { return growthStages; }
    public List<DinoMutation> getMutations() { return mutations; }

    public void setName(String name) { this.name = name; }
    public void setDiet(DinoDict diet) { this.diet = diet; }
    public void setTier(DinoTier tier) { this.tier = tier; }
    public void setAbility(String ability) { this.ability = ability; }
}
