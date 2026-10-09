-- ============================================================================
-- CivicPulse - PostgreSQL Database Relational Schema
-- ============================================================================
-- Intelligent Multi-Source Civic Incident Coordination Platform
-- Entities:
--   1. reports           - Citizen incident submissions with coordinates & evidence
--   2. incidents         - Clustered unified civic incidents with explainable severity
--   3. incident_reports  - Associative table linking reports to unified incident clusters
--   4. evidence_links    - 4-Factor pairwise correlation confidence records
--   5. resources         - Municipal fleet response units with capabilities & availability
--   6. status_history    - Immutable chronological audit trail events
-- ============================================================================

-- 1. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    report_id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(128) NOT NULL CHECK (category IN (
        'Road & Infrastructure',
        'Water & Sanitation',
        'Electrical & Public Safety'
    )),
    description TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    evidence TEXT,
    image VARCHAR(255),
    status VARCHAR(64) DEFAULT 'Linked' CHECK (status IN (
        'Open',
        'Linked',
        'Pending',
        'Resolved'
    )),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(64) DEFAULT 'Active' CHECK (status IN (
        'Active',
        'Logged',
        'Contained',
        'Resolved'
    )),
    severity INT NOT NULL CHECK (severity >= 0 AND severity <= 100),
    priority VARCHAR(32) NOT NULL CHECK (priority IN (
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    )),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_breakdown JSONB DEFAULT '{}'::jsonb,
    severity_breakdown JSONB DEFAULT '{}'::jsonb,
    shortage_detected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Incident Reports Linkage (Many-to-Many Clustering)
CREATE TABLE IF NOT EXISTS incident_reports (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    report_id VARCHAR(64) NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_incident_report UNIQUE (incident_id, report_id)
);

-- 4. Evidence Links (Pairwise 4-Factor Correlation Records)
CREATE TABLE IF NOT EXISTS evidence_links (
    id SERIAL PRIMARY KEY,
    report_a_id VARCHAR(64) NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
    report_b_id VARCHAR(64) NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
    location_score INT NOT NULL CHECK (location_score >= 0 AND location_score <= 100),
    time_score INT NOT NULL CHECK (time_score >= 0 AND time_score <= 100),
    text_score INT NOT NULL CHECK (text_score >= 0 AND text_score <= 100),
    evidence_score INT NOT NULL CHECK (evidence_score >= 0 AND evidence_score <= 100),
    overall_confidence INT NOT NULL CHECK (overall_confidence >= 0 AND overall_confidence <= 100),
    confidence_level VARCHAR(64) NOT NULL,
    reasons JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Municipal Fleet Resources Table
CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(128) NOT NULL,
    capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    availability VARCHAR(32) NOT NULL DEFAULT 'Available' CHECK (availability IN (
        'Available',
        'Unavailable',
        'AVAILABLE',
        'UNAVAILABLE'
    )),
    current_status VARCHAR(128) DEFAULT 'Ready on Standby',
    current_assignment VARCHAR(64) REFERENCES incidents(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    base_station VARCHAR(255) NOT NULL,
    cost_per_hour NUMERIC(10, 2) DEFAULT 120.00,
    capacity INT DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Incident Status Audit History Trail Table
CREATE TABLE IF NOT EXISTS status_history (
    id VARCHAR(64) PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    timestamp VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    previous_value VARCHAR(255),
    new_value VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incident_reports_incident ON incident_reports(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_report ON incident_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_status_history_incident ON status_history(incident_id);
