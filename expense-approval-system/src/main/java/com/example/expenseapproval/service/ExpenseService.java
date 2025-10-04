package com.example.expenseapproval.service;





import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.expenseapproval.model.Expense;
import com.example.expenseapproval.model.Expense.ExpenseStatus;
import com.example.expenseapproval.model.User;
import com.example.expenseapproval.repository.ExpenseRepository;
import com.example.expenseapproval.repository.UserRepository;

import config.ResourceNotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository; // To validate user exists

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public Expense getExpenseById(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id " + id));
    }

    public List<Expense> getExpensesByUserId(Long userId) {
        // Ensure user exists before fetching expenses
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        return expenseRepository.findByUserId(userId);
    }

    public List<Expense> getExpensesByUserIdAndStatus(Long userId, ExpenseStatus status) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        return expenseRepository.findByUserIdAndStatus(userId, status);
    }

    @Transactional
    public Expense createExpense(Expense expense) {
        // Validate user exists
        userRepository.findById(expense.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Submitting User not found with id " + expense.getUser().getId()));

        expense.setStatus(ExpenseStatus.PENDING); // New expenses are always pending
        expense.setSubmittedAt(LocalDateTime.now());
        expense.setCreatedAt(LocalDateTime.now());
        expense.setUpdatedAt(LocalDateTime.now());
        return expenseRepository.save(expense);
    }

    @Transactional
    public Expense updateExpense(Long id, Expense expenseDetails) {
        Expense expense = getExpenseById(id);

        // Only allow updates to certain fields if expense is still PENDING
        if (!expense.getStatus().equals(ExpenseStatus.PENDING)) {
            throw new IllegalArgumentException("Cannot update an expense that is not in PENDING status.");
        }

        expense.setAmount(expenseDetails.getAmount());
        expense.setCurrency(expenseDetails.getCurrency());
        expense.setCategory(expenseDetails.getCategory());
        expense.setDescription(expenseDetails.getDescription());
        expense.setExpenseDate(expenseDetails.getExpenseDate());
        expense.setPaidBy(expenseDetails.getPaidBy());
        expense.setUpdatedAt(LocalDateTime.now());
        return expenseRepository.save(expense);
    }

    @Transactional
    public void deleteExpense(Long id) {
        Expense expense = getExpenseById(id);
        // Maybe add logic to prevent deletion if already approved/rejected
        if (!expense.getStatus().equals(ExpenseStatus.PENDING)) {
            throw new IllegalArgumentException("Cannot delete an expense that is not in PENDING status.");
        }
        expenseRepository.delete(expense);
    }

    // Manager functionality: Get expenses submitted by subordinates
    public List<Expense> getTeamExpenses(Long managerId) {
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found with id " + managerId));

        if (!manager.getRole().equals(User.Role.MANAGER) && !manager.getRole().equals(User.Role.ADMIN)) {
            throw new IllegalArgumentException("User with id " + managerId + " is not a manager or admin.");
        }

        Optional<User> subordinates = userRepository.findById(managerId);
        // Fetch expenses for all subordinates
        return subordinates.stream()
                .flatMap(sub -> expenseRepository.findByUserId(sub.getId()).stream())
                .toList();
    }
}