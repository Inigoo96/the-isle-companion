package com.theisle.companion.dto;

import java.util.List;

public record AccountSummaryDto(
        String steamId,
        String displayName,
        String avatarUrl,
        String status,
        String createdAt,
        String lastLoginAt,
        int serverCount,
        List<ServerInfo> servers
) {
    public record ServerInfo(String slug, String name) {}
}
