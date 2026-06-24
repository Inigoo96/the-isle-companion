package com.theisle.companion.domain.entity;

import com.theisle.companion.domain.entity.id.PrimeRunTaskId;
import com.theisle.companion.domain.enums.PrimeTaskStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "prime_run_tasks")
public class PrimeRunTask {

    @EmbeddedId
    private PrimeRunTaskId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("runId")
    @JoinColumn(name = "run_id")
    private PrimeRun run;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("taskId")
    @JoinColumn(name = "task_id")
    private PrimeTask task;

    @Column(nullable = false)
    private PrimeTaskStatus status;

    public PrimeRunTaskId getId() { return id; }
    public PrimeRun getRun() { return run; }
    public PrimeTask getTask() { return task; }
    public PrimeTaskStatus getStatus() { return status; }
}
