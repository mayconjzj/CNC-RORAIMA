-- Persist the single Neon Auth organization used by CNC Roraima admin invitations.
-- This is separate from the Neon account/team organization that owns the project.
CREATE TABLE IF NOT EXISTS admin_auth_organization (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton = true),
  organization_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
