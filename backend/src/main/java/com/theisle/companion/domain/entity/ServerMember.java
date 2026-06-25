package com.theisle.companion.domain.entity;

import com.theisle.companion.domain.entity.id.ServerMemberId;
import jakarta.persistence.*;

/**
 * Co-admin de un server. El owner va en servers.owner_id y NO aparece aqui.
 * Por ahora solo se modela y se lee; el flujo de invitaciones es fase posterior.
 */
@Entity
@Table(name = "server_members")
public class ServerMember {

    @EmbeddedId
    private ServerMemberId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("serverId")
    @JoinColumn(name = "server_id")
    private Server server;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("adminId")
    @JoinColumn(name = "admin_id")
    private Admin admin;

    @Column(nullable = false, length = 24)
    private String role;

    public ServerMember() {}

    public ServerMember(Server server, Admin admin, String role) {
        this.id = new ServerMemberId(server.getId(), admin.getId());
        this.server = server;
        this.admin = admin;
        this.role = role;
    }

    public ServerMemberId getId() { return id; }
    public Server getServer() { return server; }
    public Admin getAdmin() { return admin; }
    public String getRole() { return role; }

    public void setRole(String role) { this.role = role; }
}
