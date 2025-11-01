-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('course-videos', 'course-videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('course-materials', 'course-materials', false);

-- Create storage policies for course videos (public)
CREATE POLICY "Course videos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'course-videos');

CREATE POLICY "Teachers can upload course videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'course-videos' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Teachers can update their course videos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'course-videos' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Create storage policies for course materials (private)
CREATE POLICY "Students can view enrolled course materials" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'course-materials' AND 
  (
    -- Teachers can see their own materials
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'teacher'
    ) OR
    -- Students can see materials from enrolled courses
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN profiles p ON e.student_id = p.id
      WHERE p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Teachers can upload course materials" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'course-materials' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  passing_score INTEGER NOT NULL DEFAULT 70,
  time_limit_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Quiz policies
CREATE POLICY "Students can view quizzes from enrolled courses" 
ON public.quizzes 
FOR SELECT 
USING (
  lesson_id IN (
    SELECT l.id FROM lessons l
    JOIN courses c ON l.course_id = c.id
    JOIN enrollments e ON c.id = e.course_id
    JOIN profiles p ON e.student_id = p.id
    WHERE p.user_id = auth.uid()
  ) OR
  lesson_id IN (
    SELECT l.id FROM lessons l
    JOIN courses c ON l.course_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can manage quizzes for their lessons" 
ON public.quizzes 
FOR ALL 
USING (
  lesson_id IN (
    SELECT l.id FROM lessons l
    JOIN courses c ON l.course_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
)
WITH CHECK (
  lesson_id IN (
    SELECT l.id FROM lessons l
    JOIN courses c ON l.course_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Create quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL,
  student_id UUID NOT NULL,
  score INTEGER NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  time_taken_seconds INTEGER
);

-- Enable RLS on quiz attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quiz attempt policies
CREATE POLICY "Students can view their own quiz attempts" 
ON public.quiz_attempts 
FOR SELECT 
USING (
  student_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can create their own quiz attempts" 
ON public.quiz_attempts 
FOR INSERT 
WITH CHECK (
  student_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Teachers can view quiz attempts for their courses
CREATE POLICY "Teachers can view quiz attempts for their courses" 
ON public.quiz_attempts 
FOR SELECT 
USING (
  quiz_id IN (
    SELECT q.id FROM quizzes q
    JOIN lessons l ON q.lesson_id = l.id
    JOIN courses c ON l.course_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Add updated_at trigger for quizzes
CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();