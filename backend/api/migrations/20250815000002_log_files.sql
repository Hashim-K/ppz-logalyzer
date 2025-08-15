-- Create log_files table for file metadata and deduplication
CREATE TABLE log_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for deduplication
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    storage_path VARCHAR(500) NOT NULL, -- Path to actual file in storage
    upload_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    access_count INTEGER NOT NULL DEFAULT 0,
    is_processed BOOLEAN NOT NULL DEFAULT false,
    processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    processing_error TEXT,
    metadata JSONB, -- Store additional file-specific metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for log_files table
CREATE INDEX idx_log_files_user_id ON log_files(user_id);
CREATE INDEX idx_log_files_hash ON log_files(file_hash);
CREATE INDEX idx_log_files_filename ON log_files(original_filename);
CREATE INDEX idx_log_files_upload_timestamp ON log_files(upload_timestamp);
CREATE INDEX idx_log_files_processing_status ON log_files(processing_status);
CREATE INDEX idx_log_files_size ON log_files(file_size);

-- Create file_shares table for sharing files between users
CREATE TABLE file_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES log_files(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for public shares
    share_token VARCHAR(255) UNIQUE, -- For link-based sharing
    permissions JSONB NOT NULL DEFAULT '{"read": true, "download": false}', -- Permissions object
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accessed_count INTEGER NOT NULL DEFAULT 0,
    last_accessed TIMESTAMPTZ
);

-- Create indexes for file_shares table
CREATE INDEX idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX idx_file_shares_shared_by ON file_shares(shared_by_user_id);
CREATE INDEX idx_file_shares_shared_with ON file_shares(shared_with_user_id);
CREATE INDEX idx_file_shares_token ON file_shares(share_token);
CREATE INDEX idx_file_shares_expires_at ON file_shares(expires_at);
CREATE INDEX idx_file_shares_active ON file_shares(is_active);

-- Create parsed_data table for storing processed telemetry data
CREATE TABLE parsed_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES log_files(id) ON DELETE CASCADE,
    data_type VARCHAR(100) NOT NULL, -- e.g., 'gps', 'attitude', 'battery', etc.
    timestamp_field TIMESTAMPTZ, -- Extracted timestamp from the data
    raw_data JSONB NOT NULL, -- The actual parsed data
    indexed_fields JSONB, -- Pre-computed fields for common queries
    sequence_number BIGINT, -- Order within the file
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for parsed_data table
CREATE INDEX idx_parsed_data_file_id ON parsed_data(file_id);
CREATE INDEX idx_parsed_data_type ON parsed_data(data_type);
CREATE INDEX idx_parsed_data_timestamp ON parsed_data(timestamp_field);
CREATE INDEX idx_parsed_data_sequence ON parsed_data(file_id, sequence_number);

-- Create GIN indexes for JSONB columns for efficient querying
CREATE INDEX idx_log_files_metadata_gin ON log_files USING GIN (metadata);
CREATE INDEX idx_file_shares_permissions_gin ON file_shares USING GIN (permissions);
CREATE INDEX idx_parsed_data_raw_gin ON parsed_data USING GIN (raw_data);
CREATE INDEX idx_parsed_data_indexed_gin ON parsed_data USING GIN (indexed_fields);

-- Add triggers for updated_at columns
CREATE TRIGGER update_log_files_updated_at BEFORE UPDATE ON log_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_shares_updated_at BEFORE UPDATE ON file_shares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_accessed timestamp on log_files
CREATE OR REPLACE FUNCTION update_file_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE log_files 
    SET last_accessed = NOW(), access_count = access_count + 1
    WHERE id = NEW.file_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update file access stats when parsed_data is queried
-- Note: This would typically be handled in application code for performance
