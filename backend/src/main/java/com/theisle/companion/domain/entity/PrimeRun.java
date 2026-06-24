package com.theisle.companion.domain.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "prime_runs")
public class PrimeRun {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dino_id", nullable = false)
    private Dino dino;

    @Column(name = "is_prime", nullable = false)
    private boolean prime;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "run", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<PrimeRunTask> tasks = new ArrayList<>();

    public UUID getId() { return id; }
    public Account getAccount() { return account; }
    public Dino getDino() { return dino; }
    public boolean isPrime() { return prime; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public List<PrimeRunTask> getTasks() { return tasks; }
}
