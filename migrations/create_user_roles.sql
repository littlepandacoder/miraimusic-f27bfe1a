-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Insert admin role for the new admin user
INSERT INTO public.user_roles (user_id, role)
VALUES ('4c44d706-2ce1-493d-99d6-75e2326a0c14', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the role was created
SELECT * FROM public.user_roles WHERE user_id = '4c44d706-2ce1-493d-99d6-75e2326a0c14';
