-- Retention marker for uploaded contract files.
--
-- drizzle-kit generated seven CREATE TABLE statements alongside this ALTER, for
-- tables that already exist in production but that no migration in this folder
-- ever created: they were pushed straight to the database at some point, so the
-- snapshots never learned about them. Running them would abort this migration on
-- "table already exists" and the column below would silently never appear. Only
-- the real delta is kept here. The 0011 snapshot does record those tables, so
-- future generates stay quiet.
ALTER TABLE `contracts` ADD `fileDeletedAt` timestamp;
