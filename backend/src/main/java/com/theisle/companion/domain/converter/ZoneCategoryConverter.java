package com.theisle.companion.domain.converter;

import com.theisle.companion.domain.enums.ZoneCategory;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ZoneCategoryConverter extends LowerCaseEnumConverter<ZoneCategory> {
    public ZoneCategoryConverter() { super(ZoneCategory.class); }
}
