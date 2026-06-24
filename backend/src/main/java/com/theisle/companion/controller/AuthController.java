package com.theisle.companion.controller;

import com.theisle.companion.domain.entity.Account;
import com.theisle.companion.service.AccountService;
import com.theisle.companion.service.JwtService;
import com.theisle.companion.service.SteamOpenIdService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
    private final JwtService jwtService;

    public AuthController(SteamOpenIdService steamOpenId,
                          AccountService accountService,
                          JwtService jwtService) {
        this.steamOpenId    = steamOpenId;
        this.accountService = accountService;
        this.jwtService     = jwtService;
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
                    .fromHttpUrl("http://localhost:5173/auth/callback")
                    .queryParam("token", token)
                    .build().toUriString();
        } else {
            location = UriComponentsBuilder
                    .fromPath("/auth/done")
                    .queryParam("token", token)
                    .queryParam("displayName", account.getDisplayName())
                    .build().toUri().toString();
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, location)
                .build();
    }

    @GetMapping("/done")
    public ResponseEntity<String> done(
            jakarta.servlet.http.HttpServletResponse response,
            String token, String displayName) {
        // Electron intercepta la navegación a esta URL y extrae el token del query param
        String html = """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"><title>Login successful</title></head>
                <body style="font-family:sans-serif;text-align:center;padding:40px;background:#1a1a1a;color:#fff">
                  <h2>✓ Logged in as %s</h2>
                  <p>You can close this window.</p>
                </body>
                </html>
                """.formatted(displayName != null ? displayName : "");
        return ResponseEntity.ok().header("Content-Type", "text/html").body(html);
    }
}
