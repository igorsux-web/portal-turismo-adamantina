ALTER TABLE `invitations` DROP INDEX `invitations_token_unique`;--> statement-breakpoint
ALTER TABLE `invitations` CHANGE COLUMN `token` `tokenHash` varchar(128) NOT NULL;--> statement-breakpoint
UPDATE `invitations` SET `tokenHash` = SHA2(`tokenHash`, 256);--> statement-breakpoint
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_tokenHash_unique` UNIQUE(`tokenHash`);
