package com.theisle.companion.domain.entity.id;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class ServerMemberId implements Serializable {

    @Column(name = "server_id")
    private UUID serverId;

    @Column(name = "admin_id")
    private UUID adminId;

    public ServerMemberId() {}
    public ServerMemberId(UUID serverId, UUID adminId) { this.serverId = serverId; this.adminId = adminId; }

    public UUID getServerId() { return serverId; }
    public UUID getAdminId() { return adminId; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ServerMemberId that)) return false;
        return Objects.equals(serverId, that.serverId) && Objects.equals(adminId, that.adminId);
    }
    @Override public int hashCode() { return Objects.hash(serverId, adminId); }
}
