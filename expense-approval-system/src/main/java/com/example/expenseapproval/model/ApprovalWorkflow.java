package com.example.expenseapproval.model;



import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "approval_workflows")
@Data // Provides getters, setters, equals, hashCode, and toString
@NoArgsConstructor // Provides a no-argument constructor
@AllArgsConstructor // Provides a constructor with all fields
public class ApprovalWorkflow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Companymodel company; // Ensure 'Company' model is correctly referenced

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "is_manager_approver")
    private Boolean isManagerApprover = true;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("stepOrder ASC") // Ensure steps are ordered
    private Set<ApprovalStep> approvalSteps;

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<ApprovalRule> approvalRules;

	public boolean getIsManagerApprover() {
		// TODO Auto-generated method stub
		return false;
	}

	public void setApprovalRules(Set<ApprovalRule> collect) {
		// TODO Auto-generated method stub
		
	}

	public void setIsManagerApprover(Boolean isManagerApprover2) {
		// TODO Auto-generated method stub
		
	}

    // Lombok's @Data annotation automatically generates getters, setters,
    // equals, hashCode, and toString.
    // @NoArgsConstructor and @AllArgsConstructor generate constructors.
    // So, the manual methods you had are redundant and can be removed.
    // Example of generated toString would be:
    // public String toString() { ... }
}