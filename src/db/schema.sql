-- MGNREGA Dashboard Database Schema

-- Drop table if exists
DROP TABLE IF EXISTS mgnrega_data CASCADE;

-- Create main MGNREGA data table
CREATE TABLE IF NOT EXISTS mgnrega_data (
    id SERIAL PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL,
    state_code VARCHAR(10),
    district_name VARCHAR(100) NOT NULL,
    district_code VARCHAR(10),
    block_name VARCHAR(100),
    block_code VARCHAR(10),
    panchayat_name VARCHAR(100),
    panchayat_code VARCHAR(10),
    fin_year VARCHAR(20) NOT NULL,
    
    -- Performance metrics
    total_expenditure DECIMAL(15, 2),
    total_households_worked INTEGER,
    total_persondays_generated BIGINT,
    total_women_persondays BIGINT,
    total_sc_persondays BIGINT,
    total_st_persondays BIGINT,
    
    -- Work completion metrics
    total_works_completed INTEGER,
    total_works_ongoing INTEGER,
    avg_days_employment_provided DECIMAL(10, 2),
    
    -- Payment metrics
    total_payment_made DECIMAL(15, 2),
    avg_wage_rate DECIMAL(10, 2),
    
    -- Additional data (JSON for flexibility)
    raw_data JSONB,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Create composite unique constraint
    UNIQUE(state_name, district_name, fin_year, block_name, panchayat_name)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_mgnrega_state ON mgnrega_data(state_name);
CREATE INDEX IF NOT EXISTS idx_mgnrega_district ON mgnrega_data(district_name);
CREATE INDEX IF NOT EXISTS idx_mgnrega_year ON mgnrega_data(fin_year);
CREATE INDEX IF NOT EXISTS idx_mgnrega_state_district ON mgnrega_data(state_name, district_name);
CREATE INDEX IF NOT EXISTS idx_mgnrega_state_year ON mgnrega_data(state_name, fin_year);
CREATE INDEX IF NOT EXISTS idx_mgnrega_created_at ON mgnrega_data(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mgnrega_data_updated_at 
    BEFORE UPDATE ON mgnrega_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create summary view for quick stats
CREATE OR REPLACE VIEW mgnrega_summary AS
SELECT 
    state_name,
    district_name,
    fin_year,
    SUM(total_expenditure) as total_expenditure,
    SUM(total_households_worked) as total_households_worked,
    SUM(total_persondays_generated) as total_persondays_generated,
    SUM(total_women_persondays) as total_women_persondays,
    SUM(total_works_completed) as total_works_completed,
    AVG(avg_days_employment_provided) as avg_days_employment,
    MAX(updated_at) as last_updated
FROM mgnrega_data
GROUP BY state_name, district_name, fin_year;

-- Create states lookup table
CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    state_name VARCHAR(100) UNIQUE NOT NULL,
    state_code VARCHAR(10),
    total_districts INTEGER DEFAULT 0,
    last_synced TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create districts lookup table
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    district_code VARCHAR(10),
    last_synced TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(state_name, district_name)
);

CREATE INDEX IF NOT EXISTS idx_districts_state ON districts(state_name);

-- Create API sync log table
CREATE TABLE IF NOT EXISTS api_sync_log (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL,
    state_name VARCHAR(100),
    fin_year VARCHAR(20),
    status VARCHAR(20) NOT NULL, -- success, failed, partial
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_log_status ON api_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_created ON api_sync_log(created_at);

COMMENT ON TABLE mgnrega_data IS 'Main table storing MGNREGA performance data from government API';
COMMENT ON TABLE states IS 'Lookup table for Indian states with MGNREGA data';
COMMENT ON TABLE districts IS 'Lookup table for districts across all states';
COMMENT ON TABLE api_sync_log IS 'Log of all API synchronization attempts';
