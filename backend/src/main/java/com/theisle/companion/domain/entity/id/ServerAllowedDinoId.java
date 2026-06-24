package com.theisle.companion.domain.entity.id;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class ServerAllowedDinoId implements Serializable {

    @Column(name = "server_id")
    private UUID serverId;

    @Column(name = "dino_id")
    private Integer dinoId;

    public ServerAllowedDinoId() {}
    public ServerAllowedDinoId(UUID serverId, Integer dinoId) { this.serverId = serverId; this.dinoId = dinoId; }

    public UUID getServerId() { return serverId; }
    public Integer getDinoId() { return dinoId; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ServerAllowedDinoId that)) return false;
        return Objects.equals(serverId, that.serverId) && Objects.equals(dinoId, that.dinoId);
    }
    @Override public int hashCode() { return Objects.hash(serverId, dinoId); }
}
