CREATE TABLE `clause_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`clauseId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clause_comments_id` PRIMARY KEY(`id`)
);
