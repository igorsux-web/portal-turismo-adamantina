CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('municipal_admin','moderator','analyst','partner') NOT NULL,
	`token` varchar(96) NOT NULL,
	`invitedBy` int NOT NULL,
	`acceptedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `itineraries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`ownerId` int,
	`title` varchar(180) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`description` text,
	`durationMinutes` int,
	`distanceKm` decimal(8,2),
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `itineraries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `itineraryItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itineraryId` int NOT NULL,
	`placeId` int,
	`eventId` int,
	`position` int NOT NULL DEFAULT 0,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `itineraryItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `invitations_tenant_email_idx` ON `invitations` (`tenantId`,`email`);--> statement-breakpoint
CREATE INDEX `itineraries_tenant_status_idx` ON `itineraries` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `itinerary_items_itinerary_idx` ON `itineraryItems` (`itineraryId`,`position`);