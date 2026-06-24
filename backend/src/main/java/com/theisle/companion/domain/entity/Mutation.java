package com.theisle.companion.domain.entity;

import com.theisle.companion.domain.enums.MutationCategory;
import jakarta.persistence.*;

@Entity
@Table(name = "mutations")
public class Mutation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 64)
    private String name;

    @Column(columnDefinition = "text")
    private String effect;

    @Column(nullable = false)
    private MutationCategory category;

    public Integer getId() { return id; }
    public String getName() { return name; }
    public String getEffect() { return effect; }
    public MutationCategory getCategory() { return category; }

    public void setName(String name) { this.name = name; }
    public void setEffect(String effect) { this.effect = effect; }
    public void setCategory(MutationCategory category) { this.category = category; }
}
