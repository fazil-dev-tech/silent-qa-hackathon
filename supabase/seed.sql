-- ====================================================================
-- SILENT QA: INITIAL SEED DATA
-- ====================================================================

-- 1. Create Default Organization
insert into public.organizations (id, name)
values ('11111111-1111-1111-1111-111111111111', 'Silent QA Demo Org')
on conflict (id) do nothing;

-- 2. Create Admin Profile
insert into public.profiles (id, email, role, org_id)
values (
  '22222222-2222-2222-2222-222222222222',
  'admin@silentqa.local',
  'admin',
  '11111111-1111-1111-1111-111111111111'
)
on conflict (id) do nothing;

-- 3. Create Default Project with allowed domains and test API key hash
-- Pre-hashed API key for "sqa_live_demo_key_2026"
insert into public.projects (id, org_id, name, domains, api_key_hash, recipients, retention_days)
values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Demo Ecommerce Shop',
  array['localhost', '127.0.0.1', 'shop.local'],
  encode(digest('sqa_live_demo_key_2026', 'sha256'), 'hex'),
  array['admin@silentqa.local', 'qa-team@silentqa.local'],
  7
)
on conflict (id) do nothing;

