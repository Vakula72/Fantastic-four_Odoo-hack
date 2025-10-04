import { sqliteTable, integer, text, index, real } from 'drizzle-orm/sqlite-core';

export const companies = sqliteTable('companies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  baseCurrency: text('base_currency').notNull().default('USD'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id).notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // ADMIN/MANAGER/EMPLOYEE
  managerId: integer('manager_id').references(() => users.id),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  companyIdx: index('users_company_id_idx').on(table.companyId),
  managerIdx: index('users_manager_id_idx').on(table.managerId),
  emailIdx: index('users_email_idx').on(table.email),
}));

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  category: text('category').notNull(),
  description: text('description').notNull(),
  expenseDate: text('expense_date').notNull(),
  paidBy: text('paid_by').notNull().default('PERSONAL'), // PERSONAL/COMPANY_CARD
  status: text('status').notNull().default('PENDING'), // PENDING/APPROVED/REJECTED/IN_PROGRESS
  submittedAt: text('submitted_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  userIdx: index('expenses_user_id_idx').on(table.userId),
  statusIdx: index('expenses_status_idx').on(table.status),
}));

export const approvalWorkflows = sqliteTable('approval_workflows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id).notNull(),
  name: text('name').notNull(),
  isManagerApprover: integer('is_manager_approver', { mode: 'boolean' }).default(true),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
});

export const approvalSteps = sqliteTable('approval_steps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workflowId: integer('workflow_id').references(() => approvalWorkflows.id).notNull(),
  stepOrder: integer('step_order').notNull(),
  approverRole: text('approver_role'), // ADMIN/MANAGER
  approverUserId: integer('approver_user_id').references(() => users.id),
  minAmount: real('min_amount').default(0),
  maxAmount: real('max_amount'),
});

export const approvalRules = sqliteTable('approval_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workflowId: integer('workflow_id').references(() => approvalWorkflows.id).notNull(),
  ruleType: text('rule_type').notNull(), // PERCENTAGE/SPECIFIC_APPROVER/HYBRID
  percentageRequired: integer('percentage_required'),
  specificApproverId: integer('specific_approver_id').references(() => users.id),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

export const approvals = sqliteTable('approvals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  expenseId: integer('expense_id').references(() => expenses.id).notNull(),
  approverId: integer('approver_id').references(() => users.id).notNull(),
  workflowStep: integer('workflow_step').notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING/APPROVED/REJECTED
  remarks: text('remarks'),
  approvedAt: text('approved_at'),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  expenseIdx: index('approvals_expense_id_idx').on(table.expenseId),
  approverIdx: index('approvals_approver_id_idx').on(table.approverId),
  statusIdx: index('approvals_status_idx').on(table.status),
}));

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  userId: integer('user_id').references(() => users.id).notNull(),
  token: text('token').notNull(),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  oldValue: text('old_value', { mode: 'json' }),
  newValue: text('new_value', { mode: 'json' }),
  ipAddress: text('ip_address'),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  userIdx: index('audit_logs_user_id_idx').on(table.userId),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}));