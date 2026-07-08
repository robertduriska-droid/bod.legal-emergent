CREATE TABLE `clauses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`clauseNumber` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`excerpt` text,
	`riskLevel` enum('high','medium','low') NOT NULL,
	`finding` text NOT NULL,
	`suggestedEdit` text,
	`lawyerAnnotation` text,
	`lawyerApproved` int DEFAULT 0,
	`overriddenRiskLevel` enum('high','medium','low'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clauses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(512) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(512) NOT NULL,
	`pageCount` int,
	`plan` enum('basic','standard','premium','audit') NOT NULL,
	`status` enum('pending','analyzing','in_review','completed') NOT NULL DEFAULT 'pending',
	`language` varchar(5) NOT NULL DEFAULT 'sk',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`lawyerId` int,
	`summary` text,
	`riskSummary` json,
	`recommendation` text,
	`isSigned` int NOT NULL DEFAULT 0,
	`signedAt` timestamp,
	`lawyerName` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
