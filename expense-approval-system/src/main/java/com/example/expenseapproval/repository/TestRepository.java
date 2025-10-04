package com.example.expenseapproval.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.example.expenseapproval.model.TestEntity;

public interface TestRepository extends JpaRepository<TestEntity, Long> {}
