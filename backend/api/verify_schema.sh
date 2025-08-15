#!/bin/bash

# Database verification script for ppz-logalyzer schema

# Database connection parameters
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"ppz_logalyzer"}
DB_USER=${DB_USER:-"ppz_user"}

echo "Verifying database schema for ppz-logalyzer..."
echo "Connecting to: $DB_HOST:$DB_PORT/$DB_NAME as $DB_USER"

# Check if tables exist
echo "Checking table existence..."

TABLES=(
    "users"
    "user_sessions" 
    "user_preferences"
    "log_files"
    "file_shares"
    "parsed_data"
    "analysis_templates"
    "analysis_sessions"
    "saved_reports"
    "file_annotations"
    "system_alerts"
    "audit_logs"
    "performance_metrics"
    "cache_entries"
    "database_migrations"
)

for table in "${TABLES[@]}"; do
    result=$(psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" 2>/dev/null)
    
    if [[ "$result" == *"t"* ]]; then
        echo "✓ Table $table exists"
    else
        echo "✗ Table $table does not exist"
    fi
done

echo ""
echo "Checking extensions..."

EXTENSIONS=(
    "uuid-ossp"
    "pgcrypto"
)

for ext in "${EXTENSIONS[@]}"; do
    result=$(psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -t -c "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = '$ext');" 2>/dev/null)
    
    if [[ "$result" == *"t"* ]]; then
        echo "✓ Extension $ext is installed"
    else
        echo "✗ Extension $ext is not installed"
    fi
done

echo ""
echo "Checking key indexes..."

INDEXES=(
    "idx_users_username"
    "idx_users_email"
    "idx_user_sessions_user_id"
    "idx_log_files_user_id"
    "idx_log_files_hash"
    "idx_parsed_data_file_id"
    "idx_audit_logs_user_id"
)

for index in "${INDEXES[@]}"; do
    result=$(psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -t -c "SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = '$index');" 2>/dev/null)
    
    if [[ "$result" == *"t"* ]]; then
        echo "✓ Index $index exists"
    else
        echo "✗ Index $index does not exist"
    fi
done

echo ""
echo "Checking functions and triggers..."

FUNCTIONS=(
    "update_updated_at_column"
    "update_file_last_accessed"
    "create_audit_log_partition"
    "cleanup_expired_cache"
    "cleanup_old_audit_logs"
    "cleanup_old_performance_metrics"
)

for func in "${FUNCTIONS[@]}"; do
    result=$(psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -t -c "SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = '$func');" 2>/dev/null)
    
    if [[ "$result" == *"t"* ]]; then
        echo "✓ Function $func exists"
    else
        echo "✗ Function $func does not exist"
    fi
done

echo ""
echo "Schema verification complete!"
