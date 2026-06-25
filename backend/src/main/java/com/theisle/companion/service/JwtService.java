package com.theisle.companion.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-days}") int expirationDays) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = (long) expirationDays * 24 * 60 * 60 * 1000;
    }

    /** Token del overlay (jugador): subject = steamId, type = "player". */
    public String generate(String steamId, String displayName) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(steamId)
                .claim("type", "player")
                .claim("displayName", displayName)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(key)
                .compact();
    }

    /** Token del panel (admin Discord): subject = discordUserId, type = "admin". */
    public String generateAdmin(String discordUserId, String username) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(discordUserId)
                .claim("type", "admin")
                .claim("username", username)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(key)
                .compact();
    }

    public Claims validate(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            validate(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractSteamId(String token) {
        return validate(token).getSubject();
    }
}
