package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.PrimeTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrimeTaskRepository extends JpaRepository<PrimeTask, Integer> {
    List<PrimeTask> findAllByOrderBySortOrderAsc();
}
