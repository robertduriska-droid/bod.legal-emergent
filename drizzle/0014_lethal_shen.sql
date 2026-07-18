CREATE TABLE `playbook_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`text` text NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playbook_rules_id` PRIMARY KEY(`id`)
);
