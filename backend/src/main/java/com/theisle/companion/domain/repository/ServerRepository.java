package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.Server;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServerRepository extends JpaRepository<Server, UUID> {

    @Query("""
        SELECT s FROM Server s
        LEFT JOIN FETCH s.allowedDinos ad
        LEFT JOIN FETCH ad.dino
        WHERE s.slug = :slug
        """)
    Optional<Server> findBySlugWithDinos(@Param("slug") String slug);

    @Query("""
        SELECT DISTINCT s FROM Server s
        LEFT JOIN FETCH s.allowedDinos ad
        LEFT JOIN FETCH ad.dino
        WHERE s.owner.steamId = :steamId
        ORDER BY s.createdAt DESC
        """)
    List<Server> findByOwnerSteamId(@Param("steamId") String steamId);

    @Query("""
        SELECT s FROM Server s
        LEFT JOIN FETCH s.allowedDinos ad
        LEFT JOIN FETCH ad.dino
        WHERE s.slug = :slug AND s.owner.steamId = :steamId
        """)
    Optional<Server> findBySlugAndOwnerWithDinos(@Param("slug") String slug, @Param("steamId") String steamId);

    boolean existsBySlug(String slug);
}
