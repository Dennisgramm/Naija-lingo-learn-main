-- Fix infinite recursion by using security definer functions
-- First, drop the problematic policy
DROP POLICY IF EXISTS "Students can view enrolled course teachers" ON public.profiles;

-- Create a security definer function to get enrolled course teacher IDs
CREATE OR REPLACE FUNCTION public.get_enrolled_course_teacher_ids()
RETURNS TABLE(teacher_id uuid) AS $$
  SELECT DISTINCT c.teacher_id
  FROM public.courses c
  JOIN public.enrollments e ON c.id = e.course_id
  JOIN public.profiles p ON e.student_id = p.id
  WHERE p.user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create new policy using the security definer function
CREATE POLICY "Students can view enrolled course teachers" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'teacher'::user_role AND 
  id IN (SELECT teacher_id FROM public.get_enrolled_course_teacher_ids())
);