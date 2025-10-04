package com.example.expenseapproval.model;

a
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_table")
public class TestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50)
    private String name;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public TestEntity() {}

    public TestEntity(String name) {
        this.name = name;
        this.createdAt = LocalDateTime.now();
    }


}
