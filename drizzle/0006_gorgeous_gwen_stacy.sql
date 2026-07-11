CREATE TABLE `clause_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contractId` int NOT NULL,
	`clauseId` int NOT NULL,
	`decision` enum('accepted','rejected') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clause_decisions_id` PRIMARY KEY(`id`)
);
