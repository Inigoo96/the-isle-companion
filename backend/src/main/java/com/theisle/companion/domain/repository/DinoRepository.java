package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.Dino;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DinoRepository extends JpaRepository<Dino, Integer> {

    @Query("""
        SELECT DISTINCT d FROM Dino d
        LEFT JOIN FETCH d.stats
        LEFT JOIN FETCH d.growthStages
        LEFT JOIN FETCH d.mutations m
        LEFT JOIN FETCH m.mutation
        ORDER BY d.name ASC
        """)
    List<Dino> findAllWithDetails();
}
