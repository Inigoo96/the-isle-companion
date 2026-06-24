package com.theisle.companion.service;

import com.theisle.companion.domain.entity.Account;
import com.theisle.companion.domain.enums.AccountStatus;
import com.theisle.companion.domain.repository.AccountRepository;
import com.theisle.companion.domain.repository.ServerRepository;
import com.theisle.companion.dto.AccountSummaryDto;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SuperAdminService {

    private final AccountRepository accountRepo;
    private final ServerRepository serverRepo;
    private final String superAdminSteamId;

    public SuperAdminService(AccountRepository accountRepo,
                             ServerRepository serverRepo,
                             @Value("${app.super-admin-steam-id}") String superAdminSteamId) {
        this.accountRepo = accountRepo;
        this.serverRepo  = serverRepo;
        this.superAdminSteamId = superAdminSteamId;
    }

    public boolean isSuperAdmin(String steamId) {
        return superAdminSteamId.equals(steamId);
    }

    @Transactional(readOnly = true)
    public List<AccountSummaryDto> listAccounts() {
        return accountRepo.findAllByOrderByCreatedAtDesc().stream()
                .filter(a -> !superAdminSteamId.equals(a.getSteamId()))
                .map(a -> {
                    var servers = serverRepo.findByOwnerSteamId(a.getSteamId());
                    var serverInfos = servers.stream()
                            .map(s -> new AccountSummaryDto.ServerInfo(s.getSlug(), s.getName()))
                            .toList();
                    return new AccountSummaryDto(
                            a.getSteamId(),
                            a.getDisplayName() != null ? a.getDisplayName() : "",
                            a.getAvatarUrl()   != null ? a.getAvatarUrl()   : "",
                            a.getStatus().name(),
                            a.getCreatedAt()    != null ? a.getCreatedAt().toString()    : null,
                            a.getLastLoginAt()  != null ? a.getLastLoginAt().toString()  : null,
                            servers.size(),
                            serverInfos
                    );
                })
                .toList();
    }

    @Transactional
    public void updateStatus(String targetSteamId, AccountStatus newStatus) {
        if (superAdminSteamId.equals(targetSteamId)) {
            throw new IllegalArgumentException("Cannot modify super-admin status");
        }
        Account account = accountRepo.findBySteamId(targetSteamId)
                .orElseThrow(() -> new EntityNotFoundException("Account not found: " + targetSteamId));
        account.setStatus(newStatus);
        accountRepo.save(account);
    }
}
