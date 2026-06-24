package com.theisle.companion.domain.entity;

import com.theisle.companion.domain.enums.ZoneCategory;
import com.theisle.companion.domain.enums.ZoneShape;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "zones")
public class Zone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 64)
    private String name;

    @Column(nullable = false)
    private ZoneCategory category;

    @Column(nullable = false)
    private ZoneShape shape;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String geometry;

    public Integer getId() { return id; }
    public String getName() { return name; }
    public ZoneCategory getCategory() { return category; }
    public ZoneShape getShape() { return shape; }
    public String getGeometry() { return geometry; }
}
