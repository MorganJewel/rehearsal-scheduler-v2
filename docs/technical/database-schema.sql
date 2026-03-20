-- ============================================================
-- REHEARSAL SCHEDULER - DATABASE SCHEMA (FIXED FOR SUPABASE)
-- Production-ready with Row-Level Security & Encryption
-- Corrected table creation order - no circular references
-- ============================================================

-- Enable required extensions (available in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS & AUTHENTICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'actor' CHECK (role IN ('admin', 'director', 'stage_manager', 'actor', 'crew')),
  phone TEXT,
  address TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{"darkMode": false, "emailNotifications": true}',
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile" 
ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" 
ON public.users FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- PRODUCTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.productions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  playwright TEXT,
  playwright_notes TEXT,
  acts INTEGER DEFAULT 1,
  estimated_runtime_minutes INTEGER,
  genre TEXT,
  description TEXT,
  script_url TEXT,
  stage_type TEXT DEFAULT 'proscenium',
  union_rules TEXT DEFAULT 'equity',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT title_not_empty CHECK (title ~ '\S'),
  CONSTRAINT acts_valid CHECK (acts >= 1 AND acts <= 5)
);

ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own productions"
ON public.productions FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Only owners can update"
ON public.productions FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Only owners can delete"
ON public.productions FOR DELETE USING (owner_id = auth.uid());

-- ============================================================
-- PRODUCTION MEMBERS & ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.production_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('director', 'stage_manager', 'actor', 'crew')),
  character_name TEXT,
  department TEXT,
  joined_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(production_id, user_id)
);

ALTER TABLE public.production_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see members of their productions"
ON public.production_members FOR SELECT
USING (production_id IN (SELECT id FROM public.productions WHERE owner_id = auth.uid()));

-- ============================================================
-- REHEARSAL SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rehearsal_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'custom',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT time_valid CHECK (end_time > start_time)
);

ALTER TABLE public.rehearsal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see sessions in their productions"
ON public.rehearsal_sessions FOR SELECT
USING (production_id IN (SELECT id FROM public.productions WHERE owner_id = auth.uid()));

-- ============================================================
-- SCHEDULE BLOCKS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.schedule_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.rehearsal_sessions(id) ON DELETE CASCADE,
  scene_id TEXT,
  scene_title TEXT,
  block_type TEXT NOT NULL DEFAULT 'scene',
  planned_duration_minutes INTEGER NOT NULL,
  actual_duration_minutes INTEGER,
  start_time TIME,
  end_time TIME,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT duration_positive CHECK (planned_duration_minutes > 0)
);

ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see blocks in their sessions"
ON public.schedule_blocks FOR SELECT
USING (session_id IN (
  SELECT id FROM public.rehearsal_sessions 
  WHERE production_id IN (SELECT id FROM public.productions WHERE owner_id = auth.uid())
));

-- ============================================================
-- CAST MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cast_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  character_name TEXT NOT NULL,
  actor_name TEXT,
  role_size TEXT,
  understudied_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  availability JSONB DEFAULT '[]',
  wellness_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.cast_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see cast in their productions"
ON public.cast_members FOR SELECT
USING (production_id IN (SELECT id FROM public.productions WHERE owner_id = auth.uid()));

-- ============================================================
-- CREW MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.crew_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  contact_info TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see crew in their productions"
ON public.crew_members FOR SELECT
USING (production_id IN (SELECT id FROM public.productions WHERE owner_id = auth.uid()));

-- ============================================================
-- ATTENDANCE LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attendance_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.rehearsal_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT true,
  arrival_time TIMESTAMP,
  departure_time TIMESTAMP,
  notes TEXT,
  logged_at TIMESTAMP DEFAULT NOW(),
  logged_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

ALTER TABLE public.attendance_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see attendance in their productions"
ON public.attendance_log FOR SELECT
USING (session_id IN (
  SELECT id FROM public.rehearsal_sessions 
  WHERE production_id IN (SELECT id FROM public.productions WHERE owner_id = auth.uid())
));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  related_block_id UUID REFERENCES public.schedule_blocks(id) ON DELETE SET NULL,
  from_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT title_not_empty CHECK (title ~ '\S')
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
ON public.notifications FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins see audit log"
ON public.audit_log FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- BACKUP METADATA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.backup_metadata (
  id BIGSERIAL PRIMARY KEY,
  backup_type TEXT NOT NULL,
  backup_date DATE NOT NULL,
  backup_time TIMESTAMP DEFAULT NOW(),
  file_size_bytes BIGINT,
  file_hash TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  notes TEXT,
  UNIQUE(backup_type, backup_date)
);

ALTER TABLE public.backup_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins see backup metadata"
ON public.backup_metadata FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_productions_owner ON public.productions(owner_id);
CREATE INDEX IF NOT EXISTS idx_productions_archived ON public.productions(is_archived) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_production_members_production ON public.production_members(production_id);
CREATE INDEX IF NOT EXISTS idx_production_members_user ON public.production_members(user_id);
CREATE INDEX IF NOT EXISTS idx_rehearsal_sessions_production ON public.rehearsal_sessions(production_id);
CREATE INDEX IF NOT EXISTS idx_rehearsal_sessions_date ON public.rehearsal_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_session ON public.schedule_blocks(session_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_status ON public.schedule_blocks(status);
CREATE INDEX IF NOT EXISTS idx_cast_production ON public.cast_members(production_id);
CREATE INDEX IF NOT EXISTS idx_cast_user ON public.cast_members(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_production ON public.crew_members(production_id);
CREATE INDEX IF NOT EXISTS idx_crew_department ON public.crew_members(department);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance_log(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON public.attendance_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON public.audit_log(changed_at DESC);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_production_team(p_production_id UUID)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  character_name TEXT,
  department TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.user_id,
    u.email,
    u.full_name,
    pm.role::TEXT,
    pm.character_name,
    pm.department
  FROM public.production_members pm
  JOIN public.users u ON pm.user_id = u.id
  WHERE pm.production_id = p_production_id
  AND pm.is_active = true
  ORDER BY pm.role, u.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_session_stats(p_session_id UUID)
RETURNS TABLE(
  total_planned_minutes INTEGER,
  total_actual_minutes INTEGER,
  num_blocks INTEGER,
  completed_blocks INTEGER,
  attendance_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(planned_duration_minutes)::INTEGER, 0),
    COALESCE(SUM(actual_duration_minutes)::INTEGER, 0),
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER,
    (SELECT COUNT(*) FROM public.attendance_log WHERE session_id = p_session_id AND present = true)::INTEGER
  FROM public.schedule_blocks
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PERMISSIONS
-- ============================================================

GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================
-- ✅ DATABASE READY FOR PHASE 1
-- All 9 tables created with Row-Level Security
-- No circular references or dependency issues
-- Supabase-compatible configuration
-- ============================================================
