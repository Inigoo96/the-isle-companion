package com.theisle.companion.controller;

import com.theisle.companion.domain.entity.Account;
import com.theisle.companion.domain.entity.Admin;
import com.theisle.companion.service.AccountService;
import com.theisle.companion.service.AdminService;
import com.theisle.companion.service.DiscordOAuthService;
import com.theisle.companion.service.JwtService;
import com.theisle.companion.service.OAuthStateService;
import com.theisle.companion.service.SteamOpenIdService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final SteamOpenIdService steamOpenId;
    private final AccountService accountService;
    private final DiscordOAuthService discordOAuth;
    private final OAuthStateService oauthState;
    private final AdminService adminService;
    private final JwtService jwtService;
    private final String adminUrl;

    public AuthController(SteamOpenIdService steamOpenId,
                          AccountService accountService,
                          DiscordOAuthService discordOAuth,
                          OAuthStateService oauthState,
                          AdminService adminService,
                          JwtService jwtService,
                          @Value("${app.admin-url}") String adminUrl) {
        this.steamOpenId    = steamOpenId;
        this.accountService = accountService;
        this.discordOAuth   = discordOAuth;
        this.oauthState     = oauthState;
        this.adminService   = adminService;
        this.jwtService     = jwtService;
        this.adminUrl       = adminUrl;
    }

    @GetMapping("/steam")
    public ResponseEntity<Void> steamLogin(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "overlay") String source) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(steamOpenId.buildAuthUrl(source)))
                .build();
    }

    @GetMapping("/steam/callback")
    public ResponseEntity<Void> steamCallback(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((k, v) -> params.put(k, v[0]));

        String source  = params.getOrDefault("source", "overlay");
        String steamId = steamOpenId.verify(params);
        Account account = accountService.findOrCreate(steamId);
        String token = jwtService.generate(account.getSteamId(), account.getDisplayName());

        String location;
        if ("admin".equals(source)) {
            location = UriComponentsBuilder
                    .fromHttpUrl(adminUrl + "/auth/callback")
                    .queryParam("token", token)
                    .build().toUriString();
        } else {
            location = UriComponentsBuilder
                    .fromPath("/auth/done")
                    .queryParam("token", token)
                    .queryParam("displayName", account.getDisplayName())
                    .encode()
                    .build()
                    .toUriString();
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, location)
                .build();
    }

    // --- Login del panel por Discord (independiente del flujo Steam del overlay) ---

    @GetMapping("/discord")
    public ResponseEntity<Void> discordLogin() {
        String state = oauthState.issue();
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(discordOAuth.buildAuthUrl(state)))
                .build();
    }

    @GetMapping("/discord/callback")
    public ResponseEntity<Void> discordCallback(@RequestParam String code,
                                                @RequestParam String state) {
        if (!oauthState.isValid(state)) {
            return redirectToPanel(adminUrl + "/auth/callback", "error", "invalid_state");
        }
        String accessToken = discordOAuth.exchangeCode(code);
        DiscordOAuthService.DiscordUser user = discordOAuth.fetchUser(accessToken);
        Admin admin = adminService.findOrCreate(user.id(), user.username(), user.avatarUrl());
        String token = jwtService.generateAdmin(admin.getDiscordUserId(), admin.getUsername());
        return redirectToPanel(adminUrl + "/auth/callback", "token", token);
    }

    private ResponseEntity<Void> redirectToPanel(String base, String param, String value) {
        String location = UriComponentsBuilder.fromHttpUrl(base)
                .queryParam(param, value)
                .build().toUriString();
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, location)
                .build();
    }

    @GetMapping("/done")
    public ResponseEntity<String> done(
            jakarta.servlet.http.HttpServletResponse response,
            String token, String displayName) {
        String html = """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"><title>Login successful</title></head>
                <body style="font-family:sans-serif;text-align:center;padding:40px;background:#1a1a1a;color:#fff">
                  <h2>Logged in as %s</h2>
                  <p>You can close this window.</p>
                </body>
                </html>
                """.formatted(displayName != null ? displayName : "");
        return ResponseEntity.ok().header("Content-Type", "text/html").body(html);
    }
}
