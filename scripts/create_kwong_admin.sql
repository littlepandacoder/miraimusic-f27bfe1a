-- Create Admin User: kwongofficial@gmail.com
-- Run this in Supabase SQL Editor

-- Step 1: First, create the user in Supabase Dashboard:
--   1. Go to https://supabase.com/dashboard/project/tychkyunjfbkksyxknhn/auth/users
--   2. Click "Add user" → "Create new user"
--   3. Email: kwongofficial@gmail.com
--   4. Password: TempAdmin123! (or generate one)
--   5. Auto Confirm User: YES
--   6. Click "Create user"
--   7. Copy the user's UUID from the users table

-- Step 2: After creating the user above, run this SQL to assign admin role:
-- Replace 'USER_UUID_HERE' with the actual UUID from step 1

INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_UUID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Verify the role was assigned:
SELECT u.email, ur.role, ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'kwongofficial@gmail.com';
