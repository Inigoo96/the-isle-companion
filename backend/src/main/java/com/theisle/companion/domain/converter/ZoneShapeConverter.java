package com.theisle.companion.domain.converter;

import com.theisle.companion.domain.enums.ZoneShape;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ZoneShapeConverter extends LowerCaseEnumConverter<ZoneShape> {
    public ZoneShapeConverter() { super(ZoneShape.class); }
}
