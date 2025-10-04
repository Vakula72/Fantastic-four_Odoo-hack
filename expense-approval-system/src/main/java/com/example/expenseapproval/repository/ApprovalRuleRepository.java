package com.example.expenseapproval.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.expenseapproval.model.ApprovalRule;

import java.util.List;

@Repository
public interface ApprovalRuleRepository extends JpaRepository<ApprovalRule, Long> {
    List<ApprovalRule> findByWorkflowIdAndIsActiveTrue(Long workflowId);
}