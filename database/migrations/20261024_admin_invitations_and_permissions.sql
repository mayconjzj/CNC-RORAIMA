-- CNC Roraima: invitations and per-user admin permissions
CREATE TABLE IF NOT EXISTS admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(254) NOT NULL,
  token_hash text NOT NULL UNIQUE,
  invited_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_invitations_pending_email_idx ON admin_invitations (lower(email)) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS admin_invitations_expires_idx ON admin_invitations (expires_at) WHERE status = 'pending';
CREATE TABLE IF NOT EXISTS admin_user_permissions (
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  permission varchar(40) NOT NULL CHECK (permission IN ('manage_news','manage_categories','manage_authors','manage_media','manage_users')),
  granted_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, permission)
);
-- Preserve current administrator access; newly invited users receive no permissions by default.
INSERT INTO admin_user_permissions (user_id, permission)
SELECT u.id, p.permission FROM admin_users u
CROSS JOIN (VALUES ('manage_news'),('manage_categories'),('manage_authors'),('manage_media'),('manage_users')) AS p(permission)
ON CONFLICT (user_id, permission) DO NOTHING;
