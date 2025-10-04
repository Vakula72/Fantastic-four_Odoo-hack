package com.example.expenseapproval.model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Companymodel companies;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role; // ADMIN, MANAGER, EMPLOYEE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager; // Self-referencing for manager hierarchy

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Expense> expenses;

    @OneToMany(mappedBy = "manager", fetch = FetchType.LAZY)
    private Set<User> subordinates; // For manager to see their direct reports

    @OneToMany(mappedBy = "approver", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Approval> approvals;

    @OneToMany(mappedBy = "specificApprover", fetch = FetchType.LAZY)
    private Set<ApprovalRule> approvalRules;

    public enum Role {
        ADMIN, MANAGER, EMPLOYEE
    }

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Companymodel getCompanies() {
		return companies;
	}

	public void setCompanies(Companymodel companies) {
		this.companies = companies;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public Role getRole() {
		return role;
	}

	public void setRole(Role role) {
		this.role = role;
	}

	public User getManager() {
		return manager;
	}

	public void setManager(User manager) {
		this.manager = manager;
	}

	public Boolean getIsActive() {
		return isActive;
	}

	public void setIsActive(Boolean isActive) {
		this.isActive = isActive;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}

	public Set<Expense> getExpenses() {
		return expenses;
	}

	public void setExpenses(Set<Expense> expenses) {
		this.expenses = expenses;
	}

	public Set<User> getSubordinates() {
		return subordinates;
	}

	public void setSubordinates(Set<User> subordinates) {
		this.subordinates = subordinates;
	}

	public Set<Approval> getApprovals() {
		return approvals;
	}

	public void setApprovals(Set<Approval> approvals) {
		this.approvals = approvals;
	}

	public Set<ApprovalRule> getApprovalRules() {
		return approvalRules;
	}

	public void setApprovalRules(Set<ApprovalRule> approvalRules) {
		this.approvalRules = approvalRules;
	}

	@Override
	public String toString() {
		return "User [id=" + id + ", companies=" + companies + ", name=" + name + ", email=" + email + ", passwordHash="
				+ passwordHash + ", role=" + role + ", manager=" + manager + ", isActive=" + isActive + ", createdAt="
				+ createdAt + ", updatedAt=" + updatedAt + ", expenses=" + expenses + ", subordinates=" + subordinates
				+ ", approvals=" + approvals + ", approvalRules=" + approvalRules + "]";
	}

	public User() {
		super();
		// TODO Auto-generated constructor stub
	}

	public void setCompany(Companymodel company) {
		// TODO Auto-generated method stub
		
	}



    
    
    
    
}