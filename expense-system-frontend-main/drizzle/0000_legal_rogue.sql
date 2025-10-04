CREATE TABLE `approval_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workflow_id` integer NOT NULL,
	`rule_type` text NOT NULL,
	`percentage_required` integer,
	`specific_approver_id` integer,
	`is_active` integer DEFAULT true,
	FOREIGN KEY (`workflow_id`) REFERENCES `approval_workflows`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`specific_approver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `approval_steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workflow_id` integer NOT NULL,
	`step_order` integer NOT NULL,
	`approver_role` text,
	`approver_user_id` integer,
	`min_amount` real DEFAULT 0,
	`max_amount` real,
	FOREIGN KEY (`workflow_id`) REFERENCES `approval_workflows`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approver_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `approval_workflows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`name` text NOT NULL,
	`is_manager_approver` integer DEFAULT true,
	`is_active` integer DEFAULT true,
	`created_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`expense_id` integer NOT NULL,
	`approver_id` integer NOT NULL,
	`workflow_step` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`remarks` text,
	`approved_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`expense_id`) REFERENCES `expenses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `approvals_expense_id_idx` ON `approvals` (`expense_id`);--> statement-breakpoint
CREATE INDEX `approvals_approver_id_idx` ON `approvals` (`approver_id`);--> statement-breakpoint
CREATE INDEX `approvals_status_idx` ON `approvals` (`status`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`old_value` text,
	`new_value` text,
	`ip_address` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_logs_user_id_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`base_currency` text DEFAULT 'USD' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`expense_date` text NOT NULL,
	`paid_by` text DEFAULT 'PERSONAL' NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`submitted_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `expenses_user_id_idx` ON `expenses` (`user_id`);--> statement-breakpoint
CREATE INDEX `expenses_status_idx` ON `expenses` (`status`);--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`user_id` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`manager_id` integer,
	`is_active` integer DEFAULT true,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_company_id_idx` ON `users` (`company_id`);--> statement-breakpoint
CREATE INDEX `users_manager_id_idx` ON `users` (`manager_id`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);