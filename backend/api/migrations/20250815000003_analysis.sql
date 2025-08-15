-- Create analysis_templates table for reusable analysis configurations
CREATE TABLE analysis_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_config JSONB NOT NULL, -- Analysis configuration (filters, charts, etc.)
    is_public BOOLEAN NOT NULL DEFAULT false,
    is_system BOOLEAN NOT NULL DEFAULT false, -- System-provided templates
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usage_count INTEGER NOT NULL DEFAULT 0
);

-- Create indexes for analysis_templates table
CREATE INDEX idx_analysis_templates_user_id ON analysis_templates(user_id);
CREATE INDEX idx_analysis_templates_name ON analysis_templates(name);
CREATE INDEX idx_analysis_templates_public ON analysis_templates(is_public);
CREATE INDEX idx_analysis_templates_system ON analysis_templates(is_system);
CREATE INDEX idx_analysis_templates_config_gin ON analysis_templates USING GIN (template_config);

-- Create analysis_sessions table for tracking analysis work
CREATE TABLE analysis_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_id UUID REFERENCES log_files(id) ON DELETE CASCADE, -- NULL for multi-file analysis
    template_id UUID REFERENCES analysis_templates(id) ON DELETE SET NULL,
    session_name VARCHAR(255),
    session_config JSONB NOT NULL, -- Current analysis state and configuration
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for analysis_sessions table
CREATE INDEX idx_analysis_sessions_user_id ON analysis_sessions(user_id);
CREATE INDEX idx_analysis_sessions_file_id ON analysis_sessions(file_id);
CREATE INDEX idx_analysis_sessions_template_id ON analysis_sessions(template_id);
CREATE INDEX idx_analysis_sessions_updated_at ON analysis_sessions(updated_at);
CREATE INDEX idx_analysis_sessions_config_gin ON analysis_sessions USING GIN (session_config);

-- Create saved_reports table for generated reports
CREATE TABLE saved_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_id UUID REFERENCES log_files(id) ON DELETE CASCADE,
    analysis_session_id UUID REFERENCES analysis_sessions(id) ON DELETE SET NULL,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'pdf', 'html', 'json', 'csv'
    report_data JSONB, -- For structured reports (json)
    file_path VARCHAR(500), -- For file-based reports (pdf, html)
    metadata JSONB, -- Report generation parameters
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    file_size BIGINT,
    download_count INTEGER NOT NULL DEFAULT 0,
    last_downloaded TIMESTAMPTZ
);

-- Create indexes for saved_reports table
CREATE INDEX idx_saved_reports_user_id ON saved_reports(user_id);
CREATE INDEX idx_saved_reports_file_id ON saved_reports(file_id);
CREATE INDEX idx_saved_reports_session_id ON saved_reports(analysis_session_id);
CREATE INDEX idx_saved_reports_type ON saved_reports(report_type);
CREATE INDEX idx_saved_reports_created_at ON saved_reports(created_at);
CREATE INDEX idx_saved_reports_data_gin ON saved_reports USING GIN (report_data);
CREATE INDEX idx_saved_reports_metadata_gin ON saved_reports USING GIN (metadata);

-- Create file_annotations table for user-generated notes and markers
CREATE TABLE file_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES log_files(id) ON DELETE CASCADE,
    timestamp_start TIMESTAMPTZ, -- Start time for time-based annotations
    timestamp_end TIMESTAMPTZ, -- End time for time ranges
    data_point_id UUID, -- Reference to specific parsed_data record
    annotation_type VARCHAR(50) NOT NULL, -- 'note', 'marker', 'issue', 'highlight'
    title VARCHAR(255),
    content TEXT,
    color VARCHAR(7), -- Hex color code
    metadata JSONB, -- Additional annotation data
    is_public BOOLEAN NOT NULL DEFAULT false, -- Can other users see this annotation
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for file_annotations table
CREATE INDEX idx_file_annotations_user_id ON file_annotations(user_id);
CREATE INDEX idx_file_annotations_file_id ON file_annotations(file_id);
CREATE INDEX idx_file_annotations_type ON file_annotations(annotation_type);
CREATE INDEX idx_file_annotations_timestamp_start ON file_annotations(timestamp_start);
CREATE INDEX idx_file_annotations_timestamp_end ON file_annotations(timestamp_end);
CREATE INDEX idx_file_annotations_data_point ON file_annotations(data_point_id);
CREATE INDEX idx_file_annotations_public ON file_annotations(is_public);
CREATE INDEX idx_file_annotations_metadata_gin ON file_annotations USING GIN (metadata);

-- Create system_alerts table for monitoring and notifications
CREATE TABLE system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL, -- 'processing_error', 'storage_limit', 'security', etc.
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB, -- Alert-specific data
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for system-wide alerts
    file_id UUID REFERENCES log_files(id) ON DELETE CASCADE, -- Related file if applicable
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for system_alerts table
CREATE INDEX idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX idx_system_alerts_user_id ON system_alerts(user_id);
CREATE INDEX idx_system_alerts_file_id ON system_alerts(file_id);
CREATE INDEX idx_system_alerts_resolved ON system_alerts(is_resolved);
CREATE INDEX idx_system_alerts_created_at ON system_alerts(created_at);
CREATE INDEX idx_system_alerts_metadata_gin ON system_alerts USING GIN (metadata);

-- Add triggers for updated_at columns
CREATE TRIGGER update_analysis_templates_updated_at BEFORE UPDATE ON analysis_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_sessions_updated_at BEFORE UPDATE ON analysis_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_annotations_updated_at BEFORE UPDATE ON file_annotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_alerts_updated_at BEFORE UPDATE ON system_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
