-- Table to store Monthly KPI Targets for Handle Accounts
CREATE TABLE IF NOT EXISTS v2_agency_kpi_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES v2_agency_social_profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- INSTAGRAM, TIKTOK, THREADS
    metric TEXT NOT NULL, -- Reach, Views, Followers, etc.
    target_value NUMERIC NOT NULL DEFAULT 0,
    category TEXT DEFAULT 'growth', -- growth, engagement, production
    month_year TEXT NOT NULL, -- Format: YYYY-MM (e.g., '2024-04')
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_kpi_month ON v2_agency_kpi_targets(month_year);
CREATE INDEX IF NOT EXISTS idx_kpi_profile ON v2_agency_kpi_targets(profile_id);

-- Enable RLS
ALTER TABLE v2_agency_kpi_targets ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (or customize based on your auth)
CREATE POLICY "Public Read Access" ON v2_agency_kpi_targets FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON v2_agency_kpi_targets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access" ON v2_agency_kpi_targets FOR UPDATE USING (true);
CREATE POLICY "Public Delete Access" ON v2_agency_kpi_targets FOR DELETE USING (true);
