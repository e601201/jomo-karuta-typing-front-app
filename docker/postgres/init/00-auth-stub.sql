-- Local dev stub for Supabase auth dependency
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY
);

-- Minimal stub for Supabase's auth.uid() used in RLS policies
-- Returns NULL in local dev (policies will still be created successfully)
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULL::uuid;
$$;


