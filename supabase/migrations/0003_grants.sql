-- ============================================================================
-- Role privileges for the API roles (anon, authenticated, service_role).
-- RLS (0002) governs WHICH rows are visible; these GRANTs give the base
-- table privileges the roles need at all. This mirrors Supabase's default
-- grant configuration. Row access is still fully restricted by RLS policies.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public
  to anon, authenticated, service_role;
grant all on all sequences in schema public
  to anon, authenticated, service_role;
grant all on all functions in schema public
  to anon, authenticated, service_role;

-- Ensure future objects created by the migration role are also granted.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
