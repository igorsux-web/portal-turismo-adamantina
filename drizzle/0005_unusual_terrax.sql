CREATE TABLE `placeProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`placeId` int NOT NULL,
	`serviceTags` text,
	`accommodationRooms` int,
	`accommodationBeds` int,
	`restaurantSeats` int,
	`cuisineType` varchar(160),
	`attractionDurationMinutes` int,
	`bookingUrl` text,
	`reservationPhone` varchar(40),
	`acceptsPets` int NOT NULL DEFAULT 0,
	`hasParking` int NOT NULL DEFAULT 0,
	`accessibilityFeatures` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `placeProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `placeProfiles_placeId_unique` UNIQUE(`placeId`)
);
--> statement-breakpoint
CREATE TABLE `placeResponsibles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`placeId` int NOT NULL,
	`fullName` varchar(180) NOT NULL,
	`cpfCiphertext` text,
	`email` varchar(320),
	`phone` varchar(40),
	`licenseType` varchar(120),
	`licenseNumber` varchar(120),
	`consentAt` timestamp,
	`createdBy` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `placeResponsibles_id` PRIMARY KEY(`id`),
	CONSTRAINT `placeResponsibles_placeId_unique` UNIQUE(`placeId`)
);
--> statement-breakpoint
CREATE INDEX `place_profiles_tenant_place_idx` ON `placeProfiles` (`tenantId`,`placeId`);--> statement-breakpoint
CREATE INDEX `place_responsibles_tenant_place_idx` ON `placeResponsibles` (`tenantId`,`placeId`);