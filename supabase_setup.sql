-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel User (Inti dari Aruneeka Pro)
CREATE TABLE IF NOT EXISTS v2_agency_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'Member', -- 'Owner', 'Admin', 'Member'
    status TEXT DEFAULT 'Pending', -- 'Pending', 'Active'
    avatar_url TEXT,
    theme_color TEXT,
    workspace_id UUID,          -- ID Ruang Kerja Agensi
    parent_user_id UUID,        -- ID Owner yang mendaftarkan sub-user
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Profil Sosial
CREATE TABLE IF NOT EXISTS v2_agency_social_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES v2_agency_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    handle TEXT NOT NULL,
    followers TEXT,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Content Plan
CREATE TABLE IF NOT EXISTS v2_agency_content_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID,          -- Pengunci data multi-tenant
    user_id UUID,               -- PIC ID
    author_name TEXT,            -- PIC Name (Denormalized)
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Draft',
    platform TEXT,
    content_format TEXT,
    content_pillar TEXT,
    target_account TEXT,
    script_link TEXT,
    content_link TEXT,
    post_link TEXT,
    metrics_updated BOOLEAN DEFAULT FALSE,
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Strategi Checklist
CREATE TABLE IF NOT EXISTS v2_agency_strategy_checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID,
    task TEXT NOT NULL,
    status TEXT DEFAULT 'pending', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel KPI Targets
CREATE TABLE IF NOT EXISTS v2_agency_kpi_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID,
    profile_id TEXT,
    platform TEXT,
    metric TEXT,
    target_value NUMERIC,
    category TEXT,
    month_year TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KEBIJAKAN PRIVASI MUTLAK (RLS)
-- Aktifkan RLS di semua tabel
ALTER TABLE v2_agency_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2_agency_content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2_agency_strategy_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2_agency_social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2_agency_kpi_targets ENABLE ROW LEVEL SECURITY;

-- Note: Karena sistem menggunakan Custom Auth (Username/Password di tabel), 
-- Implementasi RLS Supabase murni membutuhkan Supabase Auth. 
-- Untuk saat ini, isolasi dilakukan di level Aplikasi (Query Filter).
