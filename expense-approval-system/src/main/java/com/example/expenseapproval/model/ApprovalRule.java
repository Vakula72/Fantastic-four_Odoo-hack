package com.example.expenseapproval.model;


import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "approval_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    private ApprovalWorkflow workflow;

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", length = 20)
    private RuleType ruleType; // PERCENTAGE, SPECIFIC_APPROVER, HYBRID

    @Column(name = "percentage_required", precision = 5, scale = 2)
    private BigDecimal percentageRequired;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specific_approver_id")
    private User specificApprover;

    @Column(name = "is_active")
    private Boolean isActive = true;

    public enum RuleType {
        PERCENTAGE, SPECIFIC_APPROVER, HYBRID
    }

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public ApprovalWorkflow getWorkflow() {
		return workflow;
	}

	public void setWorkflow(ApprovalWorkflow workflow) {
		this.workflow = workflow;
	}

	public RuleType getRuleType() {
		return ruleType;
	}

	public void setRuleType(RuleType ruleType) {
		this.ruleType = ruleType;
	}

	public BigDecimal getPercentageRequired() {
		return percentageRequired;
	}

	public void setPercentageRequired(BigDecimal percentageRequired) {
		this.percentageRequired = percentageRequired;
	}

	public User getSpecificApprover() {
		return specificApprover;
	}

	public void setSpecificApprover(User specificApprover) {
		this.specificApprover = specificApprover;
	}

	public Boolean getIsActive() {
		return isActive;
	}

	public void setIsActive(Boolean isActive) {
		this.isActive = isActive;
	}

	@Override
	public String toString() {
		return "ApprovalRule [id=" + id + ", workflow=" + workflow + ", ruleType=" + ruleType + ", percentageRequired="
				+ percentageRequired + ", specificApprover=" + specificApprover + ", isActive=" + isActive + "]";
	}
    
    
}