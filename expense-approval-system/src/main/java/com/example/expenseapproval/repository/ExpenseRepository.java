package com.example.expenseapproval.repository;



import com.example.expenseapproval.model.Expense;
import com.example.expenseapproval.model.Expense.ExpenseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    // Custom queries for your service
    List<Expense> findByUserId(Long userId);

    List<Expense> findByUserIdAndStatus(Long userId, ExpenseStatus status);
}
