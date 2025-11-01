-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view teacher profiles for published courses" ON public.profiles;
DROP POLICY IF EXISTS "Students can view enrolled course teachers" ON public.profiles;

-- Create simpler, non-recursive policies
-- 1. Users can view teacher profiles (basic info only, no recursion)
CREATE POLICY "Users can view teacher profiles" 
ON public.profiles 
FOR SELECT 
USING (role = 'teacher');

-- 2. Users can view student profiles they interact with (through enrollments)
-- This will be handled at the application level to avoid recursion