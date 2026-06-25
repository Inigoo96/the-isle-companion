package com.theisle.companion.domain.converter;

import com.theisle.companion.domain.enums.AdminStatus;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class AdminStatusConverter extends LowerCaseEnumConverter<AdminStatus> {
    public AdminStatusConverter() { super(AdminStatus.class); }
}
