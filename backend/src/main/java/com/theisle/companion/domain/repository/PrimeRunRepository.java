package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.PrimeRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PrimeRunRepository extends JpaRepository<PrimeRun, UUID> {
}
