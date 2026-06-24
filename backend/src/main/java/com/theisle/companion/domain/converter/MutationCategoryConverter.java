package com.theisle.companion.domain.converter;

import com.theisle.companion.domain.enums.MutationCategory;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class MutationCategoryConverter extends LowerCaseEnumConverter<MutationCategory> {
    public MutationCategoryConverter() { super(MutationCategory.class); }
}
