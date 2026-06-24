package com.theisle.companion.domain.converter;

import com.theisle.companion.domain.enums.RecommendationTag;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class RecommendationTagConverter extends LowerCaseEnumConverter<RecommendationTag> {
    public RecommendationTagConverter() { super(RecommendationTag.class); }
}
