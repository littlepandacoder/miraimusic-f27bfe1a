-- Tighten profiles SELECT policy to disallow anonymous/public access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and teachers can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users and roles can view profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'teacher')
  )
);

-- Tighten bookings SELECT policy to disallow anonymous/public access
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;

CREATE POLICY "Authenticated users and roles can view bookings"
ON public.bookings
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'teacher')
  )
);
