package com.example.expenseapproval.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.expenseapproval.model.Companymodel;
import com.example.expenseapproval.repository.CompanyRepository;

import config.ResourceNotFoundException;

import java.util.List;

@Service
public class CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    public List<Companymodel> getAllCompanies() {
        return companyRepository.findAll();
    }

    public Companymodel getCompanyById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id " + id));
    }

    @Transactional
    public Companymodel createCompany(Companymodel company) {
        return companyRepository.save(company);
    }

    @Transactional
    public Companymodel updateCompany(Long id, Companymodel companyDetails) {
        Companymodel company = getCompanyById(id);
        company.setName(companyDetails.getName());
        company.setBaseCurrency(companyDetails.getBaseCurrency());
        return companyRepository.save(company);
    }

    @Transactional
    public void deleteCompany(Long id) {
        Companymodel company = getCompanyById(id);
        companyRepository.delete(company);
    }
}
