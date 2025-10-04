package com.example.expenseapproval.service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.expenseapproval.model.Companymodel;
import com.example.expenseapproval.model.User;
import com.example.expenseapproval.model.User.Role;
import com.example.expenseapproval.repository.CompanyRepository;
import com.example.expenseapproval.repository.UserRepository;

import config.ResourceNotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Transactional
    public User createUser(User user) {
        // Encode password before saving
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long id, User userDetails) {
        User user = getUserById(id);
        user.setName(userDetails.getName());
        user.setEmail(userDetails.getEmail());
        user.setRole(userDetails.getRole());
        user.setIsActive(userDetails.getIsActive());
        if (userDetails.getManager() != null) {
            user.setManager(userDetails.getManager());
        }
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }

    @Transactional
    public User assignManager(Long employeeId, Long managerId) {
        User employee = getUserById(employeeId);
        User manager = getUserById(managerId);

        if (!manager.getRole().equals(Role.MANAGER) && !manager.getRole().equals(Role.ADMIN)) {
            throw new IllegalArgumentException("Assigned user is not a manager or admin.");
        }
        if (!employee.getCompanies().equals(manager.getCompanies())) {
            throw new IllegalArgumentException("Manager and employee must belong to the same company.");
        }

        employee.setManager(manager);
        employee.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(employee);
    }

    @Transactional
    public User updatePassword(Long userId, String newPassword) {
        User user = getUserById(userId);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Transactional
    public Companymodel createCompanyAndAdmin(String companyName, String baseCurrency, String adminName, String adminEmail, String adminPassword) {
    	Companymodel company = new Companymodel();
        company.setName(companyName);
        company.setBaseCurrency(baseCurrency);
        company = companyRepository.save(company); // Save company first to get ID

        User adminUser = new User();
//        adminUser.setCompany(company);
        adminUser.setName(adminName);
        adminUser.setEmail(adminEmail);
        adminUser.setPasswordHash(passwordEncoder.encode(adminPassword));
        adminUser.setRole(Role.ADMIN);
        adminUser.setIsActive(true);
        userRepository.save(adminUser);

        return company;
    }
}