package com.example.expenseapproval.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.expenseapproval.model.ApprovalWorkflow;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalWorkflowRepository extends JpaRepository<ApprovalWorkflow, Long> {
    List<ApprovalWorkflow> findByCompanyId(Long companyId);
    Optional<ApprovalWorkflow> findByCompanyIdAndName(Long companyId, String name);
}