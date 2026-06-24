package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.DinoStat;
import com.theisle.companion.domain.entity.id.DinoStatId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DinoStatRepository extends JpaRepository<DinoStat, DinoStatId> {
}
