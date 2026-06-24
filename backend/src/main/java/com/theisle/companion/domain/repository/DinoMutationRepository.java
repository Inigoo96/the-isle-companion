package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.DinoMutation;
import com.theisle.companion.domain.entity.id.DinoMutationId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DinoMutationRepository extends JpaRepository<DinoMutation, DinoMutationId> {
}
