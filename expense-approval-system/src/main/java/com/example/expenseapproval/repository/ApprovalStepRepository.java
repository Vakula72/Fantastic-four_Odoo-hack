package com.example.expenseapproval.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.expenseapproval.model.ApprovalStep;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalStepRepository extends JpaRepository<ApprovalStep, Long> {
    List<ApprovalStep> findByWorkflowIdOrderByStepOrderAsc(Long workflowId);
    Optional<ApprovalStep> findByWorkflowIdAndStepOrder(Long workflowId, Integer stepOrder);
}