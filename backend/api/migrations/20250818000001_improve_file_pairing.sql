-- Add fields to improve file pairing and timestamp extraction for PaparazziUAV log files

-- Add new columns to log_files table
ALTER TABLE log_files ADD COLUMN IF NOT EXISTS base_filename VARCHAR(255);
ALTER TABLE log_files ADD COLUMN IF NOT EXISTS file_extension VARCHAR(10);
ALTER TABLE log_files ADD COLUMN IF NOT EXISTS extracted_timestamp TIMESTAMPTZ;
ALTER TABLE log_files ADD COLUMN IF NOT EXISTS file_pair_id UUID;

-- Create index for efficient pairing lookups
CREATE INDEX IF NOT EXISTS idx_log_files_base_filename ON log_files(base_filename);
CREATE INDEX IF NOT EXISTS idx_log_files_pair_id ON log_files(file_pair_id);
CREATE INDEX IF NOT EXISTS idx_log_files_extension ON log_files(file_extension);
CREATE INDEX IF NOT EXISTS idx_log_files_extracted_timestamp ON log_files(extracted_timestamp);

-- Create a view for easy file pair management
CREATE OR REPLACE VIEW file_pairs AS
SELECT 
    fp.file_pair_id,
    fp.base_filename,
    fp.extracted_timestamp,
    COUNT(*) as file_count,
    STRING_AGG(fp.file_extension, ', ' ORDER BY fp.file_extension) as extensions,
    STRING_AGG(fp.id::text, ', ' ORDER BY fp.file_extension) as file_ids,
    STRING_AGG(fp.original_filename, ', ' ORDER BY fp.file_extension) as filenames,
    SUM(fp.file_size) as total_size,
    MIN(fp.upload_timestamp) as first_upload,
    MAX(fp.upload_timestamp) as last_upload,
    fp.user_id
FROM log_files fp 
WHERE fp.file_pair_id IS NOT NULL
GROUP BY fp.file_pair_id, fp.base_filename, fp.extracted_timestamp, fp.user_id
ORDER BY fp.extracted_timestamp DESC;

COMMENT ON VIEW file_pairs IS 'View showing paired PaparazziUAV log/data files for easy management';
