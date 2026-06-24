package com.theisle.companion.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.StringJoiner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SteamOpenIdService {

    private static final String STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
    private static final String OPENID_NS        = "http://specs.openid.net/auth/2.0";
    private static final String IDENTITY_SELECT  = "http://specs.openid.net/auth/2.0/identifier_select";
    private static final Pattern STEAM_ID_PATTERN =
            Pattern.compile("https://steamcommunity\\.com/openid/id/(\\d+)$");

    @Value("${app.base-url}")
    private String baseUrl;

    public String buildAuthUrl() {
        String callbackUrl = baseUrl + "/auth/steam/callback";
        return UriComponentsBuilder.fromHttpUrl(STEAM_OPENID_URL)
                .queryParam("openid.ns",         OPENID_NS)
                .queryParam("openid.mode",        "checkid_setup")
                .queryParam("openid.return_to",   callbackUrl)
                .queryParam("openid.realm",       baseUrl)
                .queryParam("openid.identity",    IDENTITY_SELECT)
                .queryParam("openid.claimed_id",  IDENTITY_SELECT)
                .build().toUriString();
    }

    public String verify(Map<String, String> params) {
        String claimedId = params.get("openid.claimed_id");
        if (claimedId == null) throw new IllegalArgumentException("Missing openid.claimed_id");

        Matcher m = STEAM_ID_PATTERN.matcher(claimedId);
        if (!m.matches()) throw new IllegalArgumentException("Invalid claimed_id format");

        if (!checkAuthentication(params)) throw new SecurityException("Steam OpenID verification failed");

        return m.group(1);
    }

    private boolean checkAuthentication(Map<String, String> params) {
        try {
            StringJoiner body = new StringJoiner("&");
            for (Map.Entry<String, String> e : params.entrySet()) {
                if (e.getKey().equals("openid.mode")) continue;
                body.add(encode(e.getKey()) + "=" + encode(e.getValue()));
            }
            body.add("openid.mode=check_authentication");

            URL url = new URL(STEAM_OPENID_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");

            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.toString().getBytes(StandardCharsets.UTF_8));
            }

            StringBuilder response = new StringBuilder();
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = br.readLine()) != null) response.append(line).append("\n");
            }

            return response.toString().contains("is_valid:true");
        } catch (Exception e) {
            throw new SecurityException("Steam verification request failed: " + e.getMessage(), e);
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
