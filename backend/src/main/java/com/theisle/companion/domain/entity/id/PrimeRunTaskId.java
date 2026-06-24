package com.theisle.companion.domain.entity.id;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class PrimeRunTaskId implements Serializable {

    @Column(name = "run_id")
    private UUID runId;

    @Column(name = "task_id")
    private Integer taskId;

    public PrimeRunTaskId() {}
    public PrimeRunTaskId(UUID runId, Integer taskId) { this.runId = runId; this.taskId = taskId; }

    public UUID getRunId() { return runId; }
    public Integer getTaskId() { return taskId; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PrimeRunTaskId that)) return false;
        return Objects.equals(runId, that.runId) && Objects.equals(taskId, that.taskId);
    }
    @Override public int hashCode() { return Objects.hash(runId, taskId); }
}
