-- Fix security vulnerability: Restrict profile visibility
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create more restrictive policies
-- 1. Users can view their own profile (full access)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Users can view basic teacher info for published courses
CREATE POLICY "Users can view teacher profiles for published courses" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'teacher' AND 
  id IN (
    SELECT DISTINCT teacher_id 
    FROM public.courses 
    WHERE is_published = true
  )
);

-- 3. Students can view teacher profiles for courses they're enrolled in
CREATE POLICY "Students can view enrolled course teachers" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'teacher' AND 
  id IN (
    SELECT DISTINCT c.teacher_id
    FROM public.courses c
    JOIN public.enrollments e ON c.id = e.course_id
    JOIN public.profiles p ON e.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
);