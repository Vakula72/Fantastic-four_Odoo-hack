package com.example.expenseapproval.service;




//FIX: Added missing imports for model classes

//FIX: Added static imports for enum constants to be used in the switch statement
//(Assuming the enum is named RuleType and is nested within ApprovalRule)
import static com.example.expenseapproval.model.ApprovalRule.RuleType.HYBRID;
import static com.example.expenseapproval.model.ApprovalRule.RuleType.PERCENTAGE;
import static com.example.expenseapproval.model.ApprovalRule.RuleType.SPECIFIC_APPROVER;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.expenseapproval.model.Approval;
import com.example.expenseapproval.model.Approval.ApprovalStatus;
import com.example.expenseapproval.model.ApprovalRule;
import com.example.expenseapproval.model.ApprovalStep;
import com.example.expenseapproval.model.ApprovalWorkflow;
import com.example.expenseapproval.model.Expense;
import com.example.expenseapproval.model.Expense.ExpenseStatus;
import com.example.expenseapproval.model.User;
import com.example.expenseapproval.repository.ApprovalRepository;
import com.example.expenseapproval.repository.ApprovalRuleRepository;
import com.example.expenseapproval.repository.ApprovalStepRepository;
import com.example.expenseapproval.repository.ApprovalWorkflowRepository;
import com.example.expenseapproval.repository.CompanyRepository;
import com.example.expenseapproval.repository.ExpenseRepository;
import com.example.expenseapproval.repository.UserRepository;

import config.ResourceNotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ApprovalService {

 @Autowired
 private ApprovalRepository approvalRepository;

 @Autowired
 private ExpenseRepository expenseRepository;

 @Autowired
 private UserRepository userRepository;

 @Autowired
 private ApprovalWorkflowRepository approvalWorkflowRepository;

 @Autowired
 private ApprovalStepRepository approvalStepRepository;

 @Autowired
 private ApprovalRuleRepository approvalRuleRepository;

 @Autowired
 private CompanyRepository companyRepository; // Needed for createApprovalWorkflow

 public List<Approval> getApprovalsByExpenseId(Long expenseId) {
     return approvalRepository.findByExpenseId(expenseId);
 }

 public List<Approval> getPendingApprovalsForApprover(Long approverId) {
     return approvalRepository.findByApproverIdAndStatus(approverId, ApprovalStatus.PENDING);
 }

 @Transactional
 public void initiateApprovalProcess(Expense expense) {
     // Find an active approval workflow for the company
     // FIX: Changed getCompanies() to getCompany(). Calling .getId() on a collection is invalid.
     Optional<ApprovalWorkflow> workflowOpt = approvalWorkflowRepository.findByCompanyId(expense.getUser().getCompany().getId())
             .stream()
//           .filter(ApprovalWorkflow::getIsActive)
             .findFirst(); // For simplicity, take the first active one

     if (workflowOpt.isEmpty()) {
         expense.setStatus(ExpenseStatus.APPROVED); // Auto-approve if no workflow defined
         expenseRepository.save(expense);
         return;
     }

     ApprovalWorkflow workflow = workflowOpt.get();
     expense.setStatus(ExpenseStatus.IN_PROGRESS);
     expenseRepository.save(expense);

     // Step 1: Manager Approval (if required)
     if (workflow.getIsManagerApprover() && expense.getUser().getManager() != null) {
         User manager = expense.getUser().getManager();
         Approval managerApproval = new Approval();
         managerApproval.setExpense(expense);
         managerApproval.setApprover(manager);
         managerApproval.setWorkflowStep(0); // Representing manager approval as step 0
         managerApproval.setStatus(ApprovalStatus.PENDING);
         approvalRepository.save(managerApproval);
     } else {
         // If no manager approval, or manager not found, move to next step
         processNextApprovalStep(expense, workflow, 1);
     }
 }

 @Transactional
 public Approval processApproval(Long approvalId, Long approverId, ApprovalStatus status, String remarks) {
     Approval approval = approvalRepository.findById(approvalId)
             .orElseThrow(() -> new ResourceNotFoundException("Approval request not found with id " + approvalId));

     if (!approval.getApprover().getId().equals(approverId)) {
         throw new SecurityException("User " + approverId + " is not authorized to approve this request.");
     }

     if (!approval.getStatus().equals(ApprovalStatus.PENDING)) {
         throw new IllegalArgumentException("Approval request has already been processed.");
     }

     approval.setStatus(status);
     approval.setRemarks(remarks);
     approval.setApprovedAt(LocalDateTime.now());
     approvalRepository.save(approval);

     Expense expense = approval.getExpense();

     if (status.equals(ApprovalStatus.REJECTED)) {
         expense.setStatus(ExpenseStatus.REJECTED);
         expenseRepository.save(expense);
         // Optionally, notify employee
         return approval;
     }

     // If approved, check if there are more steps or if final approval
     // This is where complex workflow logic comes in
     handlePostApprovalLogic(expense, approval);

     return approval;
 }

 private void handlePostApprovalLogic(Expense expense, Approval currentApproval) {
     // Find the workflow for the expense
     // FIX: Changed getCompanies() to getCompany().
     Optional<ApprovalWorkflow> workflowOpt = approvalWorkflowRepository.findByCompanyId(expense.getUser().getCompany().getId())
             .stream()
             .filter(ApprovalWorkflow::getIsActive)
             .findFirst();

     if (workflowOpt.isEmpty()) {
         expense.setStatus(ExpenseStatus.APPROVED);
         expenseRepository.save(expense);
         return;
     }

     ApprovalWorkflow workflow = workflowOpt.get();

     // If current approval was the manager approval (step 0)
     if (currentApproval.getWorkflowStep() != null && currentApproval.getWorkflowStep() == 0) {
         processNextApprovalStep(expense, workflow, 1); // Move to the first defined step
         return;
     }

     // Check sequential steps
     List<ApprovalStep> allSteps = approvalStepRepository.findByWorkflowIdOrderByStepOrderAsc(workflow.getId());
     Optional<ApprovalStep> currentWorkflowStep = allSteps.stream()
             .filter(step -> step.getStepOrder().equals(currentApproval.getWorkflowStep()))
             .findFirst();

     int nextStepOrder = currentWorkflowStep.map(step -> step.getStepOrder() + 1).orElse(1);

     if (nextStepOrder <= allSteps.size()) {
         // There are more sequential steps
         processNextApprovalStep(expense, workflow, nextStepOrder);
     } else {
         // All sequential steps are done, apply conditional rules if any
         applyConditionalApprovalRules(expense, workflow);
     }
 }

 private void processNextApprovalStep(Expense expense, ApprovalWorkflow workflow, int stepOrder) {
     List<ApprovalStep> steps = approvalStepRepository.findByWorkflowIdOrderByStepOrderAsc(workflow.getId());
     Optional<ApprovalStep> nextStepOpt = steps.stream()
             .filter(step -> step.getStepOrder().equals(stepOrder))
             .findFirst();

     if (nextStepOpt.isPresent()) {
         ApprovalStep nextStep = nextStepOpt.get();

         // Determine approvers for this step
         Set<User> potentialApprovers = determineApproversForStep(nextStep, expense);

         if (potentialApprovers.isEmpty()) {
             // If no approvers found for this step, skip or auto-approve based on policy
             // For now, let's just move to the next step if possible
             processNextApprovalStep(expense, workflow, stepOrder + 1);
             return;
         }

         for (User approver : potentialApprovers) {
             // Check if this approver has already approved/rejected this expense in a previous step
             Optional<Approval> existingApproval = approvalRepository.findByExpenseIdAndApproverId(expense.getId(), approver.getId());
             if (existingApproval.isPresent() && !existingApproval.get().getStatus().equals(ApprovalStatus.PENDING)) {
                 // This approver already acted, skip creating a new pending approval for them
                 continue;
             }

             Approval newApproval = new Approval();
             newApproval.setExpense(expense);
             newApproval.setApprover(approver);
             newApproval.setWorkflowStep(nextStep.getStepOrder());
             newApproval.setStatus(ApprovalStatus.PENDING);
             approvalRepository.save(newApproval);
         }
         expense.setStatus(ExpenseStatus.IN_PROGRESS); // Keep in progress
         expenseRepository.save(expense);
     } else {
         // No more sequential steps, apply conditional rules
         applyConditionalApprovalRules(expense, workflow);
     }
 }

 private Set<User> determineApproversForStep(ApprovalStep step, Expense expense) {
     // Logic to find approvers based on role, specific user, or hierarchy
     Set<User> approvers = new java.util.HashSet<>();

     if (step.getApproverUser() != null) {
         // Specific user is set
         approvers.add(step.getApproverUser());
     } else if (step.getApproverUser() != null) {
         // Role-based approvers within the company
         // FIX: Changed getCompanies() to getCompany().
         approvers.addAll(userRepository.findByCompanyId(expense.getUser().getCompany().getId())
                 .stream()
                 .filter(u -> u.getRole().equals(step.getApproverRole()))
                 .collect(Collectors.toSet()));
     } else {
         // Fallback or error if no approver defined for step
         // Could throw an exception or log a warning
         System.err.println("Warning: Approval step " + step.getId() + " has no defined approver user or role.");
     }

     // Filter by amount thresholds if defined
     if (step.getMinAmount() != null && expense.getAmount().compareTo(step.getMinAmount()) < 0) {
         approvers.clear(); // Expense amount is below minimum for this step, no approval needed
     }
     if (step.getMaxAmount() != null && expense.getAmount().compareTo(step.getMaxAmount()) > 0) {
         approvers.clear(); // Expense amount is above maximum for this step, no approval needed
     }
     // This logic needs careful consideration for how to handle threshold rules:
     // - Should an expense within the threshold require approval?
     // - Should an expense *outside* the threshold be auto-approved or require a different flow?
     // Current simple implementation clears approvers if outside threshold.
     // A more robust system would involve matching workflows/steps to amount ranges.

     return approvers;
 }

 private void applyConditionalApprovalRules(Expense expense, ApprovalWorkflow workflow) {
     List<ApprovalRule> rules = approvalRuleRepository.findByWorkflowIdAndIsActiveTrue(workflow.getId());
     List<Approval> allApprovalsForExpense = approvalRepository.findByExpenseId(expense.getId());
     List<Approval> approvedApprovals = allApprovalsForExpense.stream()
             .filter(a -> a.getStatus().equals(ApprovalStatus.APPROVED))
             .toList();

     boolean fullyApproved = false;

     for (ApprovalRule rule : rules) {
         switch (rule.getRuleType()) {
             case PERCENTAGE:
                 if (rule.getPercentageRequired() != null) {
                     long totalApproversInWorkflow = allApprovalsForExpense.stream()
                             .map(Approval::getApprover)
                             .distinct()
                             .count();
                     if (totalApproversInWorkflow > 0) {
                         double approvalPercentage = (double) approvedApprovals.size() / totalApproversInWorkflow * 100;
                         if (approvalPercentage >= rule.getPercentageRequired().doubleValue()) {
                             fullyApproved = true;
                         }
                     }
                 }
                 break;
             case SPECIFIC_APPROVER:
                 if (rule.getSpecificApprover() != null) {
                     boolean specificApproverApproved = approvedApprovals.stream()
                             .anyMatch(a -> a.getApprover().getId().equals(rule.getSpecificApprover().getId()));
                     if (specificApproverApproved) {
                         fullyApproved = true;
                     }
                 }
                 break;
             case HYBRID:
                 // This rule type typically combines others, requiring more complex logic
                 // Example: (PERCENTAGE_X AND SPECIFIC_APPROVER_Y) OR (PERCENTAGE_Z)
                 // This would need a more sophisticated rule engine,
                 // For now, let's assume it implies a combination that needs to be manually implemented
                 // or configured. A simple hybrid might be: "60% approval AND CFO approval"
                 // Implementing this accurately requires more input on the desired hybrid logic.
                 // For a placeholder, let's assume it requires both if both percentage and specific approver are set
                 boolean hybridPassed = true;
                 if (rule.getPercentageRequired() != null) {
                     long totalApproversInWorkflow = allApprovalsForExpense.stream().map(Approval::getApprover).distinct().count();
                     if (totalApproversInWorkflow > 0) {
                         double approvalPercentage = (double) approvedApprovals.size() / totalApproversInWorkflow * 100;
                         if (approvalPercentage < rule.getPercentageRequired().doubleValue()) {
                             hybridPassed = false;
                         }
                     }
                 }
                 if (rule.getSpecificApprover() != null) {
                     boolean specificApproverApproved = approvedApprovals.stream()
                             .anyMatch(a -> a.getApprover().getId().equals(rule.getSpecificApprover().getId()));
                     if (!specificApproverApproved) {
                         hybridPassed = false;
                     }
                 }
                 if (hybridPassed) {
                     fullyApproved = true;
                 }
                 break;
         }
         if (fullyApproved) break; // If any rule leads to full approval, stop checking
     }

     if (fullyApproved) {
         expense.setStatus(ExpenseStatus.APPROVED);
     } else {
         // If no rule led to full approval and all steps are exhausted, it might remain IN_PROGRESS
         // or implicitly be rejected depending on business logic.
         // For now, if no rule explicitly approves it, and no more steps, it stays in_progress.
         // This is a decision point for business logic.
         // For simplicity, let's assume if all steps completed and no rule approved, it's rejected by default.
         // Or it could mean awaiting more specific conditions.
         // Let's set it to REJECTED if no approval rule matches and no more steps.
         if (approvedApprovals.size() < allApprovalsForExpense.size()) { // Not all approvals are done
             expense.setStatus(ExpenseStatus.IN_PROGRESS); // Still awaiting someone
         } else if (!fullyApproved) { // All approvals processed, but not fully approved by rules
             expense.setStatus(ExpenseStatus.REJECTED);
         }
     }
     expenseRepository.save(expense);
 }

 // Helper method to create ApprovalWorkflow
 @Transactional
 public ApprovalWorkflow createApprovalWorkflow(Long companyId, String name, Boolean isManagerApprover, List<ApprovalStep> steps, List<ApprovalRule> rules) {
     Company company = companyRepository.findById(companyId)
             .orElseThrow(() -> new ResourceNotFoundException("Company not found with id " + companyId));

     ApprovalWorkflow workflow = new ApprovalWorkflow();
     workflow.setCompany(company);
     workflow.setName(name);
     workflow.setIsManagerApprover(isManagerApprover);
     workflow.setIsActive(true);
     workflow.setCreatedAt(LocalDateTime.now());
     workflow = approvalWorkflowRepository.save(workflow);

     // Save steps
     for (int i = 0; i < steps.size(); i++) {
         ApprovalStep step = steps.get(i);
         step.setWorkflow(workflow);
         step.setStepOrder(i + 1); // Ensure correct ordering
         // Corrected: Removed incorrect cast, and fixed orElseThrow
         if (step.getApproverUser() != null && step.getApproverUser().getId() != null) {
             step.setApproverUser(userRepository.findById(step.getApproverUser().getId())
                     .orElseThrow(() -> new ResourceNotFoundException("Approver user not found for step " + step.getStepOrder())));
         }
         approvalStepRepository.save(step);
     }
     workflow.setApprovalRules(steps.stream().collect(Collectors.toSet()));


     // Save rules
     for (ApprovalRule rule : rules) {
         rule.setWorkflow(workflow);
         if (rule.getSpecificApprover() != null && rule.getSpecificApprover().getId() != null) {
             rule.setSpecificApprover(userRepository.findById(rule.getSpecificApprover().getId())
                     .orElseThrow(() -> new ResourceNotFoundException("Specific approver user not found for rule")));
         }
         approvalRuleRepository.save(rule);
     }
     workflow.setApprovalRules(rules.stream().collect(Collectors.toSet()));


     return workflow;
 }

 @Transactional
 public List<ApprovalWorkflow> getWorkflowsByCompany(Long companyId) {
     return approvalWorkflowRepository.findByCompanyId(companyId);
 }
}