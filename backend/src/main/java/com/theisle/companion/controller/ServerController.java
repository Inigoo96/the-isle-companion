package com.theisle.companion.controller;

import com.theisle.companion.dto.ServerDto;
import com.theisle.companion.dto.ServerRequest;
import com.theisle.companion.dto.ServerSummaryDto;
import com.theisle.companion.service.ServerService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/servers")
public class ServerController {

    private final ServerService service;

    public ServerController(ServerService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ServerSummaryDto>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ServerDto> bySlug(@PathVariable String slug) {
        try {
            return ResponseEntity.ok(service.getBySlug(slug));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/mine")
    public ResponseEntity<List<ServerDto>> mine(Authentication auth) {
        return ResponseEntity.ok(service.listByOwner(principal(auth)));
    }

    @PostMapping
    public ResponseEntity<ServerDto> create(Authentication auth,
                                            @RequestBody ServerRequest req) {
        try {
            ServerDto created = service.create(principal(auth), req);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{slug}")
    public ResponseEntity<ServerDto> update(Authentication auth,
                                            @PathVariable String slug,
                                            @RequestBody ServerRequest req) {
        try {
            return ResponseEntity.ok(service.update(principal(auth), slug, req));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{slug}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable String slug) {
        try {
            service.delete(principal(auth), slug);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Subject del JWT del panel = discord_user_id del admin autenticado. */
    private String principal(Authentication auth) {
        return (String) auth.getPrincipal();
    }
}
