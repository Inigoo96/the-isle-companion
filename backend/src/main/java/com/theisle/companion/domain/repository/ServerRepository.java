package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.Server;
import com.theisle.companion.domain.enums.ServerStatus;
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

    /** ¿El admin tiene algún server en alguno de esos estados? (acceso revocado). */
    boolean existsByOwnerDiscordUserIdAndStatusIn(String discordUserId,
                                                  java.util.Collection<ServerStatus> statuses);

    List<Server> findAllByOrderByNameAsc();

    /** Listado publico: solo servidores con un estado dado (p.ej. accepted). */
    List<Server> findByStatusOrderByNameAsc(ServerStatus status);

    /** Cola de moderacion: servidores por estado, con el owner cargado. */
    @Query("""
        SELECT s FROM Server s
        JOIN FETCH s.owner
        WHERE s.status = :status
        ORDER BY s.createdAt ASC
        """)
    List<Server> findByStatusWithOwner(@Param("status") ServerStatus status);
}
