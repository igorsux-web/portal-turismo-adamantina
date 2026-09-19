CREATE TABLE `privacyRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('export','deletion','consent_withdrawal') NOT NULL,
	`status` enum('requested','processing','completed','rejected') NOT NULL DEFAULT 'requested',
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `privacyRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `privacy_requests_user_idx` ON `privacyRequests` (`userId`);