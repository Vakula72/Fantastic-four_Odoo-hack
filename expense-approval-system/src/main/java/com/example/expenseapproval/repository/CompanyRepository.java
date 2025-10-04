package com.example.expenseapproval.repository;



import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.expenseapproval.model.Companymodel;

@Repository
public interface CompanyRepository extends JpaRepository<Companymodel, Long> {
}
