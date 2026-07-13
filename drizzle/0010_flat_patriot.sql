CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contractId` int NOT NULL,
	`rating` enum('positive','negative') NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
