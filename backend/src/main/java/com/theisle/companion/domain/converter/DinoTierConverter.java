package com.theisle.companion.domain.converter;

import com.theisle.companion.domain.enums.DinoTier;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class DinoTierConverter extends LowerCaseEnumConverter<DinoTier> {
    public DinoTierConverter() { super(DinoTier.class); }
}
