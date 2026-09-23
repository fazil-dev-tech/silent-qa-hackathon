-- ============================================================
-- Silent Backend QA — Supabase Database Schema
-- TCS Technology Day Hackathon
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. QA SESSIONS
-- A testing session = one QA engineer testing one page/app
-- ============================================================
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qa_engineer     TEXT NOT NULL,                          -- Name or email of the QA
    project_name    TEXT NOT NULL DEFAULT 'Default',        -- Project being tested
    page_url        TEXT,                                   -- URL under test
    browser_info    JSONB,                                  -- { browser, version, os, viewport }
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

-- Index for quick lookup of active sessions
CREATE INDEX idx_sessions_active ON sessions (is_active) WHERE is_active = TRUE;

-- ============================================================
-- 2. CAPTURED EVENTS (The "Flight Recorder" Buffer)
-- Everything the extension silently captures
-- ============================================================
CREATE TYPE event_type AS ENUM (
    'console_log',
    'console_warn',
    'console_error',
    'network_request',
    'network_response',
    'dom_mutation',
    'js_error',
    'user_action',
    'performance_metric'
);

CREATE TABLE captured_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_type      event_type NOT NULL,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Flexible payload — structure depends on event_type
    payload         JSONB NOT NULL,
    
    -- For quick filtering
    severity        TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    source_url      TEXT,                                   -- Which page/script generated this
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index: find events for a session in time order (most common query)
CREATE INDEX idx_events_session_time ON captured_events (session_id, timestamp DESC);

-- Index for filtering by type within a session
CREATE INDEX idx_events_session_type ON captured_events (session_id, event_type);

-- GIN index for searching inside JSONB payloads
CREATE INDEX idx_events_payload ON captured_events USING GIN (payload);

-- ============================================================
-- PAYLOAD EXAMPLES (for reference, not enforced in DB)
-- ============================================================
--
-- console_error:
-- { "message": "TypeError: Cannot read property 'percentage' of undefined",
--   "stack": "at checkout.js:142:15", "level": "error" }
--
-- network_request:
-- { "method": "POST", "url": "/api/cart/total", "status": 500,
--   "request_body": { "items": [...], "coupon": "SAVE10" },
--   "response_body": { "error": "discount_calc_overflow" },
--   "duration_ms": 3200, "headers": { "content-type": "application/json" } }
--
-- dom_mutation:
-- { "target_selector": "#cart-total", "mutation_type": "characterData",
--   "old_value": "₹450", "new_value": "₹500" }
--
-- js_error:
-- { "message": "Uncaught TypeError", "filename": "checkout.js",
--   "lineno": 142, "colno": 15, "stack": "..." }
--
-- user_action:
-- { "action": "click", "target_selector": "button#apply-coupon",
--   "target_text": "Apply Coupon", "coordinates": { "x": 450, "y": 320 } }
--
-- performance_metric:
-- { "metric": "LCP", "value": 2.4, "unit": "seconds",
--   "url": "/checkout" }


-- ============================================================
-- 3. DEFECT REPORTS
-- The core output: raw QA note + AI-enhanced report
-- ============================================================
CREATE TYPE defect_severity AS ENUM (
    'critical',
    'major',
    'minor',
    'trivial'
);

CREATE TYPE defect_status AS ENUM (
    'draft',
    'generated',
    'reviewed',
    'exported'
);

CREATE TABLE defect_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id          UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- HUMAN INPUT (Layer 2)
    raw_summary         TEXT NOT NULL,                      -- The QA's raw note: "cart total is wrong"
    flagged_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Exact moment QA clicked "Flag"
    
    -- EXTRACTED CONTEXT (Layer 3 — Job 1)
    extracted_context   JSONB,                              -- Structured evidence pulled from buffer
    -- { "errors": [...], "failed_requests": [...],
    --   "dom_changes": [...], "user_actions": [...],
    --   "performance": [...] }
    
    context_window_start TIMESTAMPTZ,                      -- Buffer window: start
    context_window_end   TIMESTAMPTZ,                      -- Buffer window: end (= flagged_at)
    
    -- AI-ENHANCED OUTPUT (Layer 3 — Job 2)
    enhanced_title       TEXT,                              -- AI-generated title
    enhanced_description TEXT,                              -- Full AI-generated report (markdown)
    steps_to_reproduce   TEXT[],                            -- Ordered steps array
    expected_result      TEXT,
    actual_result        TEXT,
    technical_evidence   JSONB,                             -- Structured technical findings
    environment_info     JSONB,                             -- { browser, os, viewport, url }
    
    -- METADATA
    severity            defect_severity DEFAULT 'major',
    status              defect_status NOT NULL DEFAULT 'draft',
    ai_model_used       TEXT,                               -- e.g., "gemini-2.0-flash"
    ai_confidence_score REAL CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    quality_rating      INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5), -- Human feedback
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for finding reports by session
CREATE INDEX idx_reports_session ON defect_reports (session_id, flagged_at DESC);

-- Index for filtering by status
CREATE INDEX idx_reports_status ON defect_reports (status);

-- ============================================================
-- 4. SCREENSHOTS
-- Visual evidence captured at flag time
-- ============================================================
CREATE TABLE screenshots (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    defect_report_id UUID NOT NULL REFERENCES defect_reports(id) ON DELETE CASCADE,
    storage_path    TEXT NOT NULL,                          -- Path in Supabase Storage
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    file_size_bytes INTEGER,
    mime_type       TEXT DEFAULT 'image/png'
);

CREATE INDEX idx_screenshots_report ON screenshots (defect_report_id);

-- ============================================================
-- 5. LINKED EVENTS
-- Junction table: which captured_events are linked to which defect
-- (The AI/extraction picks the relevant events from the buffer)
-- ============================================================
CREATE TABLE defect_event_links (
    defect_report_id UUID NOT NULL REFERENCES defect_reports(id) ON DELETE CASCADE,
    event_id         UUID NOT NULL REFERENCES captured_events(id) ON DELETE CASCADE,
    relevance_score  REAL DEFAULT 1.0,                      -- How relevant the AI thinks this event is (0-1)
    PRIMARY KEY (defect_report_id, event_id)
);

-- ============================================================
-- 6. AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_defect_reports_updated_at
    BEFORE UPDATE ON defect_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE captured_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE defect_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE defect_event_links ENABLE ROW LEVEL SECURITY;

-- For hackathon: allow all authenticated users full access
-- In production, scope to qa_engineer or team
CREATE POLICY "Allow authenticated access" ON sessions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON captured_events
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON defect_reports
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON screenshots
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON defect_event_links
    FOR ALL USING (auth.role() = 'authenticated');

-- Also allow anon access for hackathon demo (extension without auth)
CREATE POLICY "Allow anon access for demo" ON sessions
    FOR ALL USING (TRUE);

CREATE POLICY "Allow anon access for demo" ON captured_events
    FOR ALL USING (TRUE);

CREATE POLICY "Allow anon access for demo" ON defect_reports
    FOR ALL USING (TRUE);

CREATE POLICY "Allow anon access for demo" ON screenshots
    FOR ALL USING (TRUE);

CREATE POLICY "Allow anon access for demo" ON defect_event_links
    FOR ALL USING (TRUE);

-- ============================================================
-- 8. STORAGE BUCKET FOR SCREENSHOTS
-- ============================================================
-- Run via Supabase Dashboard or CLI:
-- supabase storage create screenshots --public

-- ============================================================
-- 9. DATABASE FUNCTIONS (RPC)
-- ============================================================

-- Get all events in the context window for a defect report
CREATE OR REPLACE FUNCTION get_defect_context(
    p_session_id UUID,
    p_flagged_at TIMESTAMPTZ,
    p_window_seconds INTEGER DEFAULT 60
)
RETURNS SETOF captured_events AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM captured_events
    WHERE session_id = p_session_id
      AND timestamp BETWEEN (p_flagged_at - (p_window_seconds || ' seconds')::INTERVAL)
                        AND p_flagged_at
    ORDER BY timestamp ASC;
END;
$$ LANGUAGE plpgsql;

-- Get only error/warning events in the context window (for AI extraction)
CREATE OR REPLACE FUNCTION get_error_context(
    p_session_id UUID,
    p_flagged_at TIMESTAMPTZ,
    p_window_seconds INTEGER DEFAULT 60
)
RETURNS SETOF captured_events AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM captured_events
    WHERE session_id = p_session_id
      AND timestamp BETWEEN (p_flagged_at - (p_window_seconds || ' seconds')::INTERVAL)
                        AND p_flagged_at
      AND (
          severity IN ('error', 'critical', 'warning')
          OR event_type IN ('js_error', 'console_error', 'console_warn')
          OR (event_type = 'network_response' AND (payload->>'status')::int >= 400)
      )
    ORDER BY timestamp ASC;
END;
$$ LANGUAGE plpgsql;

-- Get quality metrics for dashboard
CREATE OR REPLACE FUNCTION get_quality_metrics()
RETURNS TABLE (
    total_reports    BIGINT,
    avg_quality      NUMERIC,
    reports_by_severity JSONB,
    reports_by_status   JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_reports,
        ROUND(AVG(quality_rating)::NUMERIC, 2) AS avg_quality,
        jsonb_object_agg(
            COALESCE(severity::TEXT, 'unset'),
            sev_count
        ) AS reports_by_severity,
        jsonb_object_agg(
            status::TEXT,
            stat_count
        ) AS reports_by_status
    FROM (
        SELECT severity, status, quality_rating,
               COUNT(*) OVER (PARTITION BY severity) AS sev_count,
               COUNT(*) OVER (PARTITION BY status) AS stat_count
        FROM defect_reports
    ) sub;
END;
$$ LANGUAGE plpgsql;
