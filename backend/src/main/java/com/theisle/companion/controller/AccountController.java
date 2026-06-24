package com.theisle.companion.controller;

import com.theisle.companion.domain.entity.Account;
import com.theisle.companion.domain.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/me")
public class AccountController {

    private final AccountRepository accountRepo;
    private final String superAdminSteamId;

    public AccountController(AccountRepository accountRepo,
                             @Value("${app.super-admin-steam-id}") String superAdminSteamId) {
        this.accountRepo = accountRepo;
        this.superAdminSteamId = superAdminSteamId;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> me(Authentication auth) {
        String steamId = (String) auth.getPrincipal();
        Account account = accountRepo.findBySteamId(steamId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        return ResponseEntity.ok(Map.of(
                "steamId",     account.getSteamId(),
                "displayName", account.getDisplayName() != null ? account.getDisplayName() : "",
                "avatarUrl",   account.getAvatarUrl()   != null ? account.getAvatarUrl()   : "",
                "status",      account.getStatus().name(),
                "superAdmin",  superAdminSteamId.equals(account.getSteamId())
        ));
    }
}
