package com.theisle.companion.domain.entity;

import com.theisle.companion.domain.enums.PrimeTaskCategory;
import jakarta.persistence.*;

@Entity
@Table(name = "prime_tasks")
public class PrimeTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 48)
    private String key;

    @Column(nullable = false, length = 96)
    private String name;

    @Column(nullable = false)
    private PrimeTaskCategory category;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "is_default_active", nullable = false)
    private boolean defaultActive;

    @Column(nullable = false)
    private Short sortOrder;

    public Integer getId() { return id; }
    public String getKey() { return key; }
    public String getName() { return name; }
    public PrimeTaskCategory getCategory() { return category; }
    public String getDescription() { return description; }
    public boolean isDefaultActive() { return defaultActive; }
    public Short getSortOrder() { return sortOrder; }
}
