CREATE TABLE `visitorProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(160),
	`bio` text,
	`city` varchar(120),
	`state` varchar(80),
	`country` varchar(80) DEFAULT 'Brasil',
	`interests` text,
	`profileVisibility` enum('private','public') NOT NULL DEFAULT 'private',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visitorProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `visitorProfiles_userId_unique` UNIQUE(`userId`)
);
