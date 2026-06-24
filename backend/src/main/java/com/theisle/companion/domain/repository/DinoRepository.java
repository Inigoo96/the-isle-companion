package com.theisle.companion.domain.repository;

import com.theisle.companion.domain.entity.Dino;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DinoRepository extends JpaRepository<Dino, Integer> {

    List<Dino> findAllByOrderByNameAsc();
}
