package com.theisle.companion.domain.converter;

import com.theisle.companion.domain.enums.PrimeTaskStatus;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PrimeTaskStatusConverter extends LowerCaseEnumConverter<PrimeTaskStatus> {
    public PrimeTaskStatusConverter() { super(PrimeTaskStatus.class); }
}
