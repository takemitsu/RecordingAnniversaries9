CREATE TABLE `authenticators` (
	`credential_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`provider_account_id` varchar(255) NOT NULL,
	`credential_public_key` varchar(255) NOT NULL,
	`counter` int NOT NULL,
	`credential_device_type` varchar(255) NOT NULL,
	`credential_backed_up` boolean NOT NULL,
	`transports` varchar(255),
	CONSTRAINT `authenticators_user_id_credential_id_pk` PRIMARY KEY(`user_id`,`credential_id`)
);
--> statement-breakpoint
ALTER TABLE `anniversaries` DROP FOREIGN KEY `anniversaries_collection_id_collections_id_fk`;
--> statement-breakpoint
ALTER TABLE `authenticators` ADD CONSTRAINT `authenticators_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anniversaries` ADD CONSTRAINT `anniversaries_collection_id_collections_id_fk` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE cascade ON UPDATE no action;