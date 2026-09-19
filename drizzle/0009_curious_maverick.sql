ALTER TABLE `places` ADD `cadasturSource` varchar(255);--> statement-breakpoint
ALTER TABLE `places` ADD `cadasturValidatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `places` ADD `sismapaStatus` enum('not_informed','pending','validated','not_applicable') DEFAULT 'not_informed' NOT NULL;--> statement-breakpoint
ALTER TABLE `places` ADD `sismapaReference` varchar(120);--> statement-breakpoint
ALTER TABLE `places` ADD `registryNotes` text;