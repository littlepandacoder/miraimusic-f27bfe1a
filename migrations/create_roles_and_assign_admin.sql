BEGIN;

-- Create roles lookup table
CREATE TABLE IF NOT EXISTS public.roles (
  name TEXT PRIMARY KEY,
  description TEXT
);

-- Seed canonical roles
INSERT INTO public.roles (name, description) VALUES
  ('admin', 'Administrator with full access'),
  ('teacher', 'Teacher with content management permissions'),
  ('student', 'Student with limited access')
ON CONFLICT (name) DO NOTHING;

-- Ensure user_roles table exists (compatible with existing code)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- (Optional) If you want to enforce that role values exist in roles table, add a check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_role_fk'
  ) THEN
    -- Add a simple foreign key-like constraint by using a trigger or skip to avoid migration failures
    NULL; -- skipping strict FK to keep compatibility
  END IF;
END$$;

-- Assign admin role to the known admin user's ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('471b02c4-c2d6-4faf-bd86-d92a76d2fc46', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

COMMIT;

-- Verification queries (output when run interactively)
SELECT * FROM public.roles ORDER BY name;
SELECT * FROM public.user_roles WHERE user_id = '471b02c4-c2d6-4faf-bd86-d92a76d2fc46';
