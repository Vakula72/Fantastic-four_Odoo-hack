package com.example.expenseapproval.model;




import config.Workflow;
import jakarta.persistence.*;

@Entity
@Table(name = "approval_steps")
public class ApprovalStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Step number in the sequence (e.g., 1, 2, 3)
    @Column(nullable = false)
    private int stepOrder;

    // Role responsible for this step (e.g., MANAGER, FINANCE)
    @Column(nullable = false)
    private String role;

    // Whether this step is approved/rejected
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StepStatus status = StepStatus.PENDING;

    // Optional comment or rejection reason
    private String comment;

    // Relation to workflow (the parent)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id")
    private ApprovalWorkflow workflow;

    public enum StepStatus {
        PENDING, APPROVED, REJECTED
    }

    // ------------- Getters & Setters ----------------
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getStepOrder() {
        return stepOrder;
    }

    public void setStepOrder(int stepOrder) {
        this.stepOrder = stepOrder;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public StepStatus getStatus() {
        return status;
    }

    public void setStatus(StepStatus status) {
        this.status = status;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public ApprovalWorkflow getWorkflow() {
        return workflow;
    }

    public void setWorkflow(ApprovalWorkflow workflow2) {
        this.workflow = workflow2;
    }

	public Object getApproverUser() {
		// TODO Auto-generated method stub
		return null;
	}

	public void setApproverUser(User orElseThrow) {
		// TODO Auto-generated method stub
		
	}
}
