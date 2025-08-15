-- PPZ-Logalyzer Database Initialization
-- This script sets up the initial database structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create initial database user permissions
GRANT ALL PRIVILEGES ON DATABASE ppz_logalyzer TO ppz_user;

-- Create schema for application tables
CREATE SCHEMA IF NOT EXISTS ppz_logalyzer;
GRANT ALL ON SCHEMA ppz_logalyzer TO ppz_user;

-- Set default schema
ALTER USER ppz_user SET search_path TO ppz_logalyzer, public;
