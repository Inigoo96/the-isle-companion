package com.theisle.companion.controller;

import com.theisle.companion.dto.*;
import com.theisle.companion.service.GameDataService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class GameDataController {

    private final GameDataService service;

    public GameDataController(GameDataService service) {
        this.service = service;
    }

    @GetMapping("/dinos")
    public List<DinoDto> dinos() {
        return service.getDinos();
    }

    @GetMapping("/mutations")
    public List<MutationDto> mutations() {
        return service.getMutations();
    }

    @GetMapping("/zones")
    public List<ZoneDto> zones() {
        return service.getZones();
    }

    @GetMapping("/prime-tasks")
    public List<PrimeTaskDto> primeTasks() {
        return service.getPrimeTasks();
    }
}
