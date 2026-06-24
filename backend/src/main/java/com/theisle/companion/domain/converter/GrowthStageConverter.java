package com.theisle.companion.domain.converter;

import com.theisle.companion.domain.enums.GrowthStage;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class GrowthStageConverter extends LowerCaseEnumConverter<GrowthStage> {
    public GrowthStageConverter() { super(GrowthStage.class); }
}
