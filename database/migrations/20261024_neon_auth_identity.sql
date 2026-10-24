-- Link existing administrative records to Neon Auth identities.
-- Keep legacy password hashes temporarily so the current administrator can securely link the old account.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS auth_user_id text;
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_auth_user_id_idx
  ON admin_users (auth_user_id)
  WHERE auth_user_id IS NOT NULL;
ALTER TABLE admin_users ALTER COLUMN password_hash DROP NOT NULL;
