CREATE TABLE `company` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`url` text,
	`linkedin` text,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `currency` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	CONSTRAINT "currency_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE `hunt` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hunt_status_id` integer NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`start_date` integer NOT NULL,
	`end_date` integer,
	FOREIGN KEY (`hunt_status_id`) REFERENCES `hunt_status`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hunt_status` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interaction_type_role` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interaction_role` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`person_id` integer,
	`role_id` integer NOT NULL,
	`interaction_type_id` integer NOT NULL,
	`occurred_at` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`interaction_type_id`) REFERENCES `interaction_type_role`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `interaction_type_person` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interaction_person` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person_id` integer NOT NULL,
	`interaction_type_id` integer NOT NULL,
	`occurred_at` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`interaction_type_id`) REFERENCES `interaction_type_person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `person` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`title` text,
	`phone` text,
	`email` text,
	`linkedin` text,
	`notes` text,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `role` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hunt_id` integer NOT NULL,
	`company_id` integer NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`description` text,
	`description_document_path` text,
	`description_document_name` text,
	`notes` text,
	`salary_lower_end` integer,
	`salary_higher_end` integer,
	`currency_id` integer,
	FOREIGN KEY (`hunt_id`) REFERENCES `hunt`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`currency_id`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE `role_tag` (
	`role_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY (`role_id`, `tag_id`),
	FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `person_tag` (
	`person_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY (`person_id`, `tag_id`),
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE no action
);
