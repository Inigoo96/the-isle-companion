package com.theisle.companion.domain.converter;

import com.theisle.companion.domain.enums.ServerStatus;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ServerStatusConverter extends LowerCaseEnumConverter<ServerStatus> {
    public ServerStatusConverter() { super(ServerStatus.class); }
}
