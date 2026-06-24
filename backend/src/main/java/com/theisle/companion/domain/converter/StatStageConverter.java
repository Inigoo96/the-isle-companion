package com.theisle.companion.domain.converter;

import com.theisle.companion.domain.enums.StatStage;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class StatStageConverter extends LowerCaseEnumConverter<StatStage> {
    public StatStageConverter() { super(StatStage.class); }
}
