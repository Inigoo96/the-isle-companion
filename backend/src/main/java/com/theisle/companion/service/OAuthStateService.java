package com.theisle.companion.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * Genera y valida el parametro {@code state} del flujo OAuth2 (anti-CSRF).
 * El state es un token firmado de vida corta: un atacante no puede falsificarlo
 * sin el secreto, y caduca enseguida. Stateless: no guardamos nada en sesion.
 */
@Service
public class OAuthStateService {

    private static final String PURPOSE = "discord-oauth";
    private static final long TTL_MS = 10 * 60 * 1000; // 10 minutos

    private final SecretKey key;

    public OAuthStateService(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String issue() {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .claim("purpose", PURPOSE)
                .issuedAt(new Date(now))
                .expiration(new Date(now + TTL_MS))
                .signWith(key)
                .compact();
    }

    public boolean isValid(String state) {
        if (state == null) return false;
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(state)
                    .getPayload();
            return PURPOSE.equals(claims.get("purpose"));
        } catch (Exception e) {
            return false;
        }
    }
}
