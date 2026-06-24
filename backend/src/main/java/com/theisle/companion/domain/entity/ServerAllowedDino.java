package com.theisle.companion.domain.entity;

import com.theisle.companion.domain.entity.id.ServerAllowedDinoId;
import jakarta.persistence.*;

@Entity
@Table(name = "server_allowed_dinos")
public class ServerAllowedDino {

    @EmbeddedId
    private ServerAllowedDinoId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("serverId")
    @JoinColumn(name = "server_id")
    private Server server;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("dinoId")
    @JoinColumn(name = "dino_id")
    private Dino dino;

    public ServerAllowedDino() {}

    public ServerAllowedDino(Server server, Dino dino) {
        this.id = new ServerAllowedDinoId(server.getId(), dino.getId());
        this.server = server;
        this.dino = dino;
    }

    public ServerAllowedDinoId getId() { return id; }
    public Server getServer() { return server; }
    public Dino getDino() { return dino; }
}
