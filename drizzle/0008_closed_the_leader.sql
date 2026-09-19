ALTER TABLE `tenants` ADD `publicBrandName` varchar(160) DEFAULT 'Viva Adamantina' NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `responsibleSecretariat` varchar(180) DEFAULT 'Secretaria de Cultura e Turismo' NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `logoUrl` text;--> statement-breakpoint
ALTER TABLE `tenants` ADD `primaryColor` varchar(20) DEFAULT '#0d5c4d' NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `secondaryColor` varchar(20) DEFAULT '#c4703a' NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `officialDomain` varchar(255);--> statement-breakpoint
ALTER TABLE `tenants` ADD `contactEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `tenants` ADD `contactPhone` varchar(40);--> statement-breakpoint
ALTER TABLE `tenants` ADD `ombudsmanUrl` text;--> statement-breakpoint
ALTER TABLE `tenants` ADD `socialLinks` text;