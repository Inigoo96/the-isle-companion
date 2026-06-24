package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.Zone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ZoneRepository extends JpaRepository<Zone, Integer> {
    List<Zone> findAllByOrderByCategoryAscNameAsc();
}
