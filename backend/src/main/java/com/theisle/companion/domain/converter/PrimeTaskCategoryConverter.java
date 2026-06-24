package com.theisle.companion.domain.converter;

import com.theisle.companion.domain.enums.PrimeTaskCategory;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PrimeTaskCategoryConverter extends LowerCaseEnumConverter<PrimeTaskCategory> {
    public PrimeTaskCategoryConverter() { super(PrimeTaskCategory.class); }
}
