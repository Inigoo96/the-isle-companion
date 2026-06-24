package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.ServerAllowedDino;
import com.theisle.companion.domain.entity.id.ServerAllowedDinoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ServerAllowedDinoRepository extends JpaRepository<ServerAllowedDino, ServerAllowedDinoId> {

    @Modifying
    @Query("DELETE FROM ServerAllowedDino sad WHERE sad.server.id = :serverId")
    void deleteByServerId(@Param("serverId") UUID serverId);
}
