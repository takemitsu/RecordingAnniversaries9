ALTER TABLE `authenticators` ADD `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `authenticators` ADD `last_used_at` timestamp;