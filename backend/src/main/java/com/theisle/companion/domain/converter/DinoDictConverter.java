package com.theisle.companion.domain.converter;

import com.theisle.companion.domain.enums.DinoDict;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class DinoDictConverter extends LowerCaseEnumConverter<DinoDict> {
    public DinoDictConverter() { super(DinoDict.class); }
}
