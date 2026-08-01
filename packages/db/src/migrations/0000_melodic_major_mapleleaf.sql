CREATE TABLE `appointment` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`starts_at` integer NOT NULL,
	`client_id` text NOT NULL,
	`master_id` text NOT NULL,
	`salon_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`master_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`salon_id`) REFERENCES `salon`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `appointment_starts_at_idx` ON `appointment` (`starts_at`);--> statement-breakpoint
CREATE INDEX `appointment_client_id_idx` ON `appointment` (`client_id`);--> statement-breakpoint
CREATE INDEX `appointment_master_id_idx` ON `appointment` (`master_id`);--> statement-breakpoint
CREATE INDEX `appointment_salon_id_idx` ON `appointment` (`salon_id`);--> statement-breakpoint
CREATE TABLE `appointment_personnel` (
	`appointment_id` text NOT NULL,
	`personnel_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`personnel_id`, `appointment_id`),
	FOREIGN KEY (`appointment_id`) REFERENCES `appointment`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`personnel_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verifications` (`identifier`);--> statement-breakpoint
CREATE TABLE `bank_account` (
	`id` text PRIMARY KEY NOT NULL,
	`legal_entity_id` text NOT NULL,
	`iban` text NOT NULL,
	`currency` text NOT NULL,
	`bank_name` text,
	`swift` text,
	`display_name` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`legal_entity_id`) REFERENCES `legal_entity`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bank_account_iban_unique` ON `bank_account` (`iban`);--> statement-breakpoint
CREATE INDEX `bank_account_legal_entity_id_idx` ON `bank_account` (`legal_entity_id`);--> statement-breakpoint
CREATE TABLE `bank_statement_attachment` (
	`id` text PRIMARY KEY NOT NULL,
	`bank_statement_entry_id` text,
	`r2_key` text NOT NULL,
	`original_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`uploaded_by_id` text,
	`uploaded_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`bank_statement_entry_id`) REFERENCES `bank_statement_entry`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bank_statement_attachment_r2_key_unique` ON `bank_statement_attachment` (`r2_key`);--> statement-breakpoint
CREATE INDEX `bank_statement_attachment_entry_id_idx` ON `bank_statement_attachment` (`bank_statement_entry_id`);--> statement-breakpoint
CREATE INDEX `bank_statement_attachment_uploaded_at_idx` ON `bank_statement_attachment` (`uploaded_at`);--> statement-breakpoint
CREATE TABLE `bank_statement_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`bank_account_id` text NOT NULL,
	`external_ref` text NOT NULL,
	`doc_number` text,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`direction` text NOT NULL,
	`counterparty_name` text,
	`counterparty_iban` text,
	`counterparty_bank` text,
	`swift` text,
	`purpose` text,
	`transaction_type` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`imported_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`bank_account_id`) REFERENCES `bank_account`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bank_statement_entry_account_ref_unique` ON `bank_statement_entry` (`bank_account_id`,`external_ref`);--> statement-breakpoint
CREATE INDEX `bank_statement_entry_bank_account_id_idx` ON `bank_statement_entry` (`bank_account_id`);--> statement-breakpoint
CREATE INDEX `bank_statement_entry_date_idx` ON `bank_statement_entry` (`date`);--> statement-breakpoint
CREATE TABLE `cash_transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`created_at` integer NOT NULL,
	`description` text,
	`notes` text,
	`customer_id` text NOT NULL,
	`created_by_id` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `cash_transaction_created_at_id_idx` ON `cash_transaction` (`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `cash_transaction_customer_id_idx` ON `cash_transaction` (`customer_id`);--> statement-breakpoint
CREATE INDEX `cash_transaction_currency_created_at_idx` ON `cash_transaction` (`currency`,`created_at`);--> statement-breakpoint
CREATE TABLE `customer` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone_number` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_name_unique` ON `customer` (`name`);--> statement-breakpoint
CREATE TABLE `hair_assigned` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_id` text,
	`hair_order_id` text NOT NULL,
	`weight_in_grams` integer DEFAULT 0 NOT NULL,
	`sold_for` integer DEFAULT 0 NOT NULL,
	`profit` integer DEFAULT 0 NOT NULL,
	`price_per_gram` integer DEFAULT 0 NOT NULL,
	`sold_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`client_id` text NOT NULL,
	`created_by_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointment`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`hair_order_id`) REFERENCES `hair_order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `hair_assigned_sold_at_idx` ON `hair_assigned` (`sold_at`);--> statement-breakpoint
CREATE INDEX `hair_assigned_client_id_idx` ON `hair_assigned` (`client_id`);--> statement-breakpoint
CREATE INDEX `hair_assigned_appointment_id_idx` ON `hair_assigned` (`appointment_id`);--> statement-breakpoint
CREATE INDEX `hair_assigned_hair_order_id_idx` ON `hair_assigned` (`hair_order_id`);--> statement-breakpoint
CREATE TABLE `hair_order` (
	`id` text PRIMARY KEY NOT NULL,
	`uid` integer NOT NULL,
	`placed_at` text,
	`arrived_at` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`weight_received` integer DEFAULT 0 NOT NULL,
	`weight_used` integer DEFAULT 0 NOT NULL,
	`price_per_gram` integer DEFAULT 0 NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`customer_id` text NOT NULL,
	`created_by_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hair_order_uid_unique` ON `hair_order` (`uid`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`preferred_currency` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_variant` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`size` text NOT NULL,
	`price` integer NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variant_product_id_size_unique` ON `product_variant` (`product_id`,`size`);--> statement-breakpoint
CREATE INDEX `product_variant_product_id_idx` ON `product_variant` (`product_id`);--> statement-breakpoint
CREATE TABLE `order` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`type` text DEFAULT 'PURCHASE' NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`placed_at` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_customer_id_idx` ON `order` (`customer_id`);--> statement-breakpoint
CREATE TABLE `order_item` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_variant_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`total_price` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_variant_id`) REFERENCES `product_variant`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_item_order_id_product_variant_id_unique` ON `order_item` (`order_id`,`product_variant_id`);--> statement-breakpoint
CREATE INDEX `order_item_order_id_idx` ON `order_item` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_item_product_variant_id_idx` ON `order_item` (`product_variant_id`);--> statement-breakpoint
CREATE TABLE `transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`notes` text,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`customer_id` text,
	`order_id` text,
	`appointment_id` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointment`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `transaction_appointment_id_idx` ON `transaction` (`appointment_id`);--> statement-breakpoint
CREATE INDEX `transaction_customer_id_idx` ON `transaction` (`customer_id`);--> statement-breakpoint
CREATE INDEX `transaction_order_id_idx` ON `transaction` (`order_id`);--> statement-breakpoint
CREATE TABLE `legal_entity` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`country` text NOT NULL,
	`default_currency` text NOT NULL,
	`registration_number` text,
	`vat_number` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `salon` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `note` (
	`id` text PRIMARY KEY NOT NULL,
	`note` text NOT NULL,
	`customer_id` text NOT NULL,
	`appointment_id` text,
	`hair_order_id` text,
	`created_by_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointment`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`hair_order_id`) REFERENCES `hair_order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `note_customer_id_idx` ON `note` (`customer_id`);--> statement-breakpoint
CREATE INDEX `note_appointment_id_idx` ON `note` (`appointment_id`);--> statement-breakpoint
CREATE INDEX `note_hair_order_id_idx` ON `note` (`hair_order_id`);