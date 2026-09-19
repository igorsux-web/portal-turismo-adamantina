CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`eventId` int NOT NULL,
	`visitorHash` varchar(128) NOT NULL,
	`residenceCity` varchar(120),
	`residenceState` varchar(80),
	`residenceCountry` varchar(80) DEFAULT 'Brasil',
	`source` enum('portal','qr_code') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`actorId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(80),
	`entityId` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`name` varchar(120) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`icon` varchar(40),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`entityType` enum('place','event') NOT NULL,
	`entityId` int NOT NULL,
	`authorId` int NOT NULL,
	`body` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`description` text,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp,
	`venueName` varchar(180),
	`address` text,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`organizer` varchar(180),
	`capacity` int,
	`price` varchar(80),
	`accessibility` text,
	`status` enum('draft','pending','approved','rejected','archived') NOT NULL DEFAULT 'draft',
	`submittedBy` int,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `places` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`categoryId` int,
	`name` varchar(180) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`description` text,
	`type` varchar(120),
	`address` text,
	`neighborhood` varchar(120),
	`city` varchar(120) NOT NULL DEFAULT 'Adamantina',
	`state` varchar(2) NOT NULL DEFAULT 'SP',
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`phone` varchar(40),
	`email` varchar(320),
	`website` text,
	`socialLinks` text,
	`openingHours` text,
	`accessibility` text,
	`priceRange` varchar(30),
	`capacity` int,
	`cadasturNumber` varchar(80),
	`cadasturStatus` enum('not_informed','pending','validated','rejected') NOT NULL DEFAULT 'not_informed',
	`status` enum('draft','pending','approved','rejected','archived') NOT NULL DEFAULT 'draft',
	`submittedBy` int,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `places_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`placeId` int NOT NULL,
	`authorId` int NOT NULL,
	`rating` int NOT NULL,
	`body` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`submittedBy` int NOT NULL,
	`entityType` enum('place','event','review','comment','photo') NOT NULL,
	`entityId` int,
	`payload` text NOT NULL,
	`status` enum('pending','approved','rejected','needs_changes') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(160) NOT NULL,
	`state` varchar(2) NOT NULL DEFAULT 'SP',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','platform_admin','municipal_admin','moderator','analyst','partner') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','invited','suspended') DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE INDEX `attendance_tenant_event_idx` ON `attendance` (`tenantId`,`eventId`);--> statement-breakpoint
CREATE INDEX `audit_tenant_created_idx` ON `auditLogs` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `events_tenant_start_idx` ON `events` (`tenantId`,`startsAt`);--> statement-breakpoint
CREATE INDEX `places_tenant_status_idx` ON `places` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `submissions_tenant_status_idx` ON `submissions` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `users_tenant_idx` ON `users` (`tenantId`);