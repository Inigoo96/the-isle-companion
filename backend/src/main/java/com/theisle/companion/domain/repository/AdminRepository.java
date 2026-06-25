package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.Admin;
import com.theisle.companion.domain.enums.AdminStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AdminRepository extends JpaRepository<Admin, UUID> {
    Optional<Admin> findByDiscordUserId(String discordUserId);

    /** Cola de moderacion: admins por estado, mas antiguos primero. */
    List<Admin> findByStatusOrderByCreatedAtAsc(AdminStatus status);
}
