package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.Mutation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MutationRepository extends JpaRepository<Mutation, Integer> {
    List<Mutation> findAllByOrderByNameAsc();
}
