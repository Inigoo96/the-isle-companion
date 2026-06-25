package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.ServerMember;
import com.theisle.companion.domain.entity.id.ServerMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ServerMemberRepository extends JpaRepository<ServerMember, ServerMemberId> {

    @Query("""
        SELECT m FROM ServerMember m
        JOIN FETCH m.admin
        WHERE m.server.id = :serverId
        """)
    List<ServerMember> findByServerIdWithAdmin(@Param("serverId") UUID serverId);
}
