package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.DinoGrowthStage;
import com.theisle.companion.domain.entity.id.DinoGrowthStageId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DinoGrowthStageRepository extends JpaRepository<DinoGrowthStage, DinoGrowthStageId> {
}
