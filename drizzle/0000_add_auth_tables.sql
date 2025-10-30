-- Auth.js用テーブル追加
-- accounts: OAuth連携情報
-- auth_sessions: Auth.jsセッション（既存Laravelのsessionsと区別）

CREATE TABLE `accounts` (
	`userId` bigint unsigned NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255),
	CONSTRAINT `accounts_provider_providerAccountId_pk` PRIMARY KEY(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`sessionToken` varchar(255) NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `auth_sessions_sessionToken` PRIMARY KEY(`sessionToken`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
