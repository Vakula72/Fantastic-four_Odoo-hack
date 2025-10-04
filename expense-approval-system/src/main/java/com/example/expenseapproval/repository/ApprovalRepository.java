package com.example.expenseapproval.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.expenseapproval.model.Approval;
import com.example.expenseapproval.model.Approval.ApprovalStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalRepository extends JpaRepository<Approval, Long> {
    List<Approval> findByExpenseId(Long expenseId);
    Optional<Approval> findByExpenseIdAndApproverId(Long expenseId, Long approverId);
    List<Approval> findByApproverIdAndStatus(Long approverId, ApprovalStatus status);
}