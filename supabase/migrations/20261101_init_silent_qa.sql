-- ====================================================================
-- SILENT QA: HARDENED PRODUCTION SCHEMA MIGRATION
-- ====================================================================

-- 1. Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Organizations & Profiles
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('tester', 'lead', 'admin')),
  org_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3. Projects under test
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  domains text[] not null default '{}',
  api_key_hash text not null,
  recipients text[] not null default '{}',
  retention_days int not null default 7,
  created_at timestamptz not null default now()
);

-- 4. OTP Auth Codes (Hashed)
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5. Sessions
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tester_id uuid references public.profiles(id) on delete set null,
  app_url text not null,
  user_agent text,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

-- 6. Events (Telemetry partitioned by range on ts)
create table if not exists public.events (
  id uuid default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  ts timestamptz not null,
  type text not null, -- 'click', 'network', 'dom', 'error', 'signal', 'websocket'
  severity text not null default 'info', -- 'info', 'warn', 'error', 'critical'
  url text,
  method text,
  status int,
  selector text,
  text text,
  shape jsonb,
  fingerprint text,
  primary key (id, ts)
) partition by range (ts);

-- Default partition fallback
create table if not exists public.events_default partition of public.events default;

-- High-performance indexes
create index if not exists idx_events_session_ts on public.events (session_id, ts desc);
create index if not exists idx_events_fingerprint on public.events (fingerprint);
create index if not exists idx_events_type_severity on public.events (type, severity);

-- 7. Complaints (1-line flags by human tester)
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  note text not null,
  picked_selector text,
  submitted_at timestamptz not null default now(),
  window_start timestamptz,
  window_end timestamptz
);

-- 8. Defect Reports (AI-written + Human-approved)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references public.complaints(id) on delete set null,
  title text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  steps jsonb not null default '[]'::jsonb,
  expected text not null,
  actual text not null,
  root_cause text,
  confidence text check (confidence in ('low', 'medium', 'high')),
  evidence jsonb not null default '{}'::jsonb, -- Permanent archived snapshot
  evidence_ids uuid[] not null default '{}',
  playwright_script text,                    -- Synthesized test
  status text not null default 'draft' check (status in ('draft', 'approved', 'sent', 'open', 'in_progress', 'fixed', 'verified')),
  ai_provider text,
  ai_fallback boolean not null default false,
  assignee_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Evidence cross-reference link table
create table if not exists public.report_events (
  report_id uuid not null references public.reports(id) on delete cascade,
  event_id uuid not null,
  primary key (report_id, event_id)
);

-- 10. Audit and Email Logs
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  to_addresses text[] not null,
  status text not null check (status in ('pending', 'delivered', 'failed')),
  sent_at timestamptz,
  error text
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_id uuid,
  details jsonb,
  timestamp timestamptz not null default now()
);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.sessions enable row level security;
alter table public.events enable row level security;
alter table public.complaints enable row level security;
alter table public.reports enable row level security;
alter table public.email_log enable row level security;
alter table public.audit_log enable row level security;

-- RLS Policies
create policy "Allow service_role full access on all tables" on public.profiles for all using (true) with check (true);
create policy "Allow service_role full access on projects" on public.projects for all using (true) with check (true);
create policy "Allow service_role full access on sessions" on public.sessions for all using (true) with check (true);
create policy "Allow service_role full access on events" on public.events for all using (true) with check (true);
create policy "Allow service_role full access on complaints" on public.complaints for all using (true) with check (true);
create policy "Allow service_role full access on reports" on public.reports for all using (true) with check (true);
create policy "Allow service_role full access on email_log" on public.email_log for all using (true) with check (true);
create policy "Allow service_role full access on audit_log" on public.audit_log for all using (true) with check (true);

