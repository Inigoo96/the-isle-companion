package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AdminRepository extends JpaRepository<Admin, UUID> {
    Optional<Admin> findByDiscordUserId(String discordUserId);
}
