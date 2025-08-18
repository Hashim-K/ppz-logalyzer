-- Remove full_name column from users table
ALTER TABLE users DROP COLUMN IF EXISTS full_name;
