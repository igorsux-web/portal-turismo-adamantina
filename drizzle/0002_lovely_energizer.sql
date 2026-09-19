CREATE TABLE `media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`entityType` enum('place','event') NOT NULL,
	`entityId` int NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`url` text NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`altText` varchar(240),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qrCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`eventId` int NOT NULL,
	`code` varchar(96) NOT NULL,
	`label` varchar(120),
	`active` int NOT NULL DEFAULT 1,
	`expiresAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qrCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `qrCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE INDEX `media_entity_idx` ON `media` (`tenantId`,`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `qr_codes_event_idx` ON `qrCodes` (`tenantId`,`eventId`);