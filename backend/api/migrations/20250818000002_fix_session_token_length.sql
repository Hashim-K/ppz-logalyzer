-- Fix session token field lengths for JWT tokens
-- JWT tokens are typically much longer than 255 characters

ALTER TABLE user_sessions 
ALTER COLUMN session_token TYPE TEXT,
ALTER COLUMN refresh_token TYPE TEXT;
