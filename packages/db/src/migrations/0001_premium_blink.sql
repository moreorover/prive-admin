ALTER TABLE `accounts` ADD `issuer` text;--> statement-breakpoint
UPDATE `accounts` SET `issuer` = 'local:credential' WHERE `provider_id` = 'credential';--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`issuer` text NOT NULL,
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
INSERT INTO `__new_accounts` (
	`id`,
	`account_id`,
	`provider_id`,
	`issuer`,
	`user_id`,
	`access_token`,
	`refresh_token`,
	`id_token`,
	`access_token_expires_at`,
	`refresh_token_expires_at`,
	`scope`,
	`password`,
	`created_at`,
	`updated_at`
) SELECT
	`id`,
	`account_id`,
	`provider_id`,
	`issuer`,
	`user_id`,
	`access_token`,
	`refresh_token`,
	`id_token`,
	`access_token_expires_at`,
	`refresh_token_expires_at`,
	`scope`,
	`password`,
	`created_at`,
	`updated_at`
FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `account_issuer_accountId_uidx` ON `accounts` (`issuer`,`account_id`);
