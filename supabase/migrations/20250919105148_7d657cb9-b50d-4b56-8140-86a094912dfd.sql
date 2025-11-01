-- Add approval system for lessons/videos
-- Add approval status column to lessons table
ALTER TABLE public.lessons 
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add approved_by and approved_at columns for tracking
ALTER TABLE public.lessons 
ADD COLUMN approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance
CREATE INDEX idx_lessons_approval_status ON public.lessons(approval_status);

-- Update RLS policy for students to only see approved lessons
DROP POLICY IF EXISTS "Students can view lessons from enrolled courses" ON public.lessons;

CREATE POLICY "Students can view approved lessons from enrolled courses" 
ON public.lessons 
FOR SELECT 
USING (
  approval_status = 'approved' AND
  (course_id IN ( SELECT e.course_id
   FROM (enrollments e
     JOIN profiles p ON ((e.student_id = p.id)))
  WHERE (p.user_id = auth.uid())) OR (course_id IN ( SELECT c.id
   FROM (courses c
     JOIN profiles p ON ((c.teacher_id = p.id)))
  WHERE (p.user_id = auth.uid()))))
);

-- Create policy for admins to see all lessons
CREATE POLICY "Admins can view all lessons" 
ON public.lessons 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create policy for admins to update lesson approval status
CREATE POLICY "Admins can update lesson approval" 
ON public.lessons 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);