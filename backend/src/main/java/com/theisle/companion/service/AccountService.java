package com.theisle.companion.service;

import com.theisle.companion.domain.entity.Account;
import com.theisle.companion.domain.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AccountService {

    private static final Pattern PERSONA_NAME =
            Pattern.compile("\"personaname\":\"([^\"]+)\"");
    private static final Pattern AVATAR_FULL =
            Pattern.compile("\"avatarfull\":\"([^\"]+)\"");

    private final AccountRepository accountRepo;
    private final String steamApiKey;

    public AccountService(AccountRepository accountRepo,
                          @Value("${steam.api-key:}") String steamApiKey) {
        this.accountRepo = accountRepo;
        this.steamApiKey = steamApiKey;
    }

    @Transactional
    public Account findOrCreate(String steamId) {
        return accountRepo.findBySteamId(steamId)
                .map(a -> { a.setLastLoginAt(OffsetDateTime.now()); return accountRepo.save(a); })
                .orElseGet(() -> create(steamId));
    }

    private Account create(String steamId) {
        String[] profile = fetchSteamProfile(steamId);

        Account a = new Account();
        a.setId(UUID.randomUUID());
        a.setSteamId(steamId);
        a.setDisplayName(profile[0]);
        a.setAvatarUrl(profile[1]);
        a.setPrefs("{}");
        a.setCreatedAt(OffsetDateTime.now());
        a.setLastLoginAt(OffsetDateTime.now());
        return accountRepo.save(a);
    }

    private String[] fetchSteamProfile(String steamId) {
        if (steamApiKey == null || steamApiKey.isBlank()) {
            return new String[]{ steamId, null };
        }
        try {
            String apiUrl = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/"
                    + "?key=" + steamApiKey + "&steamids=" + steamId;
            HttpURLConnection conn = (HttpURLConnection) new URL(apiUrl).openConnection();
            conn.setRequestMethod("GET");

            StringBuilder sb = new StringBuilder();
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream()))) {
                String line;
                while ((line = br.readLine()) != null) sb.append(line);
            }

            String body = sb.toString();
            Matcher nameMatcher   = PERSONA_NAME.matcher(body);
            Matcher avatarMatcher = AVATAR_FULL.matcher(body);

            String name   = nameMatcher.find()   ? nameMatcher.group(1)   : steamId;
            String avatar = avatarMatcher.find()  ? avatarMatcher.group(1) : null;
            return new String[]{ name, avatar };
        } catch (Exception e) {
            return new String[]{ steamId, null };
        }
    }
}
