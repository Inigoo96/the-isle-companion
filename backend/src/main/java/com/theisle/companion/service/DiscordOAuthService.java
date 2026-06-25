package com.theisle.companion.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.StringJoiner;

/**
 * Cliente del OAuth2 de Discord para el login del panel. Hace tres cosas:
 * construir la URL de autorizacion, canjear el {@code code} por un access token
 * y leer el perfil del usuario. El token de Discord se usa solo en el callback
 * y NUNCA se persiste.
 */
@Service
public class DiscordOAuthService {

    private static final String AUTHORIZE_URL = "https://discord.com/api/oauth2/authorize";
    private static final String TOKEN_URL     = "https://discord.com/api/oauth2/token";
    private static final String USERS_ME_URL  = "https://discord.com/api/users/@me";
    private static final String SCOPES        = "identify guilds";

    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;
    private final HttpClient http;
    private final ObjectMapper mapper;

    public DiscordOAuthService(@Value("${discord.client-id}") String clientId,
                               @Value("${discord.client-secret}") String clientSecret,
                               @Value("${discord.redirect-uri}") String redirectUri,
                               ObjectMapper mapper) {
        this.clientId     = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri  = redirectUri;
        this.mapper       = mapper;
        this.http         = HttpClient.newHttpClient();
    }

    public String buildAuthUrl(String state) {
        return UriComponentsBuilder.fromHttpUrl(AUTHORIZE_URL)
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", SCOPES)
                .queryParam("state", state)
                .encode()  // codifica el espacio de "identify guilds" y el redirect_uri
                .build().toUriString();
    }

    /** Canjea el authorization code por un access token de Discord. */
    public String exchangeCode(String code) {
        Map<String, String> form = new LinkedHashMap<>();
        form.put("client_id", clientId);
        form.put("client_secret", clientSecret);
        form.put("grant_type", "authorization_code");
        form.put("code", code);
        form.put("redirect_uri", redirectUri);

        JsonNode body = postForm(TOKEN_URL, form);
        JsonNode accessToken = body.get("access_token");
        if (accessToken == null || accessToken.isNull()) {
            throw new IllegalStateException("Discord token exchange did not return an access_token");
        }
        return accessToken.asText();
    }

    /** Lee el perfil del usuario autenticado (GET /users/@me). */
    public DiscordUser fetchUser(String accessToken) {
        JsonNode body = getJson(USERS_ME_URL, accessToken);
        String id       = text(body, "id");
        String username = text(body, "global_name");
        if (username == null) username = text(body, "username");
        String avatar   = text(body, "avatar");
        String avatarUrl = (id != null && avatar != null)
                ? "https://cdn.discordapp.com/avatars/" + id + "/" + avatar + ".png"
                : null;
        return new DiscordUser(id, username, avatarUrl);
    }

    // --- HTTP helpers ---------------------------------------------------------

    private JsonNode postForm(String url, Map<String, String> form) {
        StringJoiner body = new StringJoiner("&");
        form.forEach((k, v) -> body.add(encode(k) + "=" + encode(v)));
        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();
        return send(req);
    }

    private JsonNode getJson(String url, String accessToken) {
        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .header("Authorization", "Bearer " + accessToken)
                .header("Accept", "application/json")
                .GET()
                .build();
        return send(req);
    }

    private JsonNode send(HttpRequest req) {
        try {
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() / 100 != 2) {
                throw new IllegalStateException("Discord API returned HTTP " + resp.statusCode());
            }
            return mapper.readTree(resp.body());
        } catch (Exception e) {
            throw new IllegalStateException("Discord API request failed: " + e.getMessage(), e);
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asText();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    public record DiscordUser(String id, String username, String avatarUrl) {}
}
