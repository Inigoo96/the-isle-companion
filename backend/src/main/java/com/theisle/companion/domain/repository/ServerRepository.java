package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.Server;
import com.theisle.companion.domain.enums.AdminStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServerRepository extends JpaRepository<Server, UUID> {

    @Query("""
        SELECT s FROM Server s
        JOIN FETCH s.owner
        LEFT JOIN FETCH s.allowedDinos ad
        LEFT JOIN FETCH ad.dino
        WHERE s.slug = :slug
        """)
    Optional<Server> findBySlugWithDinos(@Param("slug") String slug);

    @Query("""
        SELECT DISTINCT s FROM Server s
        LEFT JOIN FETCH s.allowedDinos ad
        LEFT JOIN FETCH ad.dino
        WHERE s.owner.discordUserId = :discordUserId
        ORDER BY s.createdAt DESC
        """)
    List<Server> findByOwnerDiscordUserId(@Param("discordUserId") String discordUserId);

    @Query("""
        SELECT s FROM Server s
        LEFT JOIN FETCH s.allowedDinos ad
        LEFT JOIN FETCH ad.dino
        WHERE s.slug = :slug AND s.owner.discordUserId = :discordUserId
        """)
    Optional<Server> findBySlugAndOwnerWithDinos(@Param("slug") String slug,
                                                 @Param("discordUserId") String discordUserId);

    boolean existsBySlug(String slug);

    boolean existsByDiscordGuildId(String discordGuildId);

    long countByOwnerId(UUID ownerId);

    /** Listado publico: solo los servers de admins con un estado dado (p.ej. accepted). */
    @Query("""
        SELECT s FROM Server s
        WHERE s.owner.status = :ownerStatus
        ORDER BY s.name ASC
        """)
    List<Server> findByOwnerStatusOrderByNameAsc(@Param("ownerStatus") AdminStatus ownerStatus);
}
