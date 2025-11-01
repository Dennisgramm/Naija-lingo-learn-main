-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'admin');

-- Create enum for course levels  
CREATE TYPE public.course_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Create enum for lesson types
CREATE TYPE public.lesson_type AS ENUM ('video', 'text', 'quiz');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  language TEXT NOT NULL,
  level course_level NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type lesson_type NOT NULL DEFAULT 'video',
  video_url TEXT,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  UNIQUE(student_id, course_id)
);

-- Create lesson progress table
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  watched_duration_seconds INTEGER DEFAULT 0,
  UNIQUE(enrollment_id, lesson_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for courses
CREATE POLICY "Anyone can view published courses"
ON public.courses FOR SELECT
TO authenticated
USING (is_published = true);

CREATE POLICY "Teachers can view their own courses"
ON public.courses FOR SELECT
TO authenticated
USING (teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can create courses"
ON public.courses FOR INSERT
TO authenticated
WITH CHECK (teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'teacher'));

CREATE POLICY "Teachers can update their own courses"
ON public.courses FOR UPDATE
TO authenticated
USING (teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create RLS policies for lessons
CREATE POLICY "Students can view lessons from enrolled courses"
ON public.lessons FOR SELECT
TO authenticated
USING (
  course_id IN (
    SELECT e.course_id 
    FROM public.enrollments e
    JOIN public.profiles p ON e.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
  OR
  course_id IN (
    SELECT c.id
    FROM public.courses c
    JOIN public.profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can manage lessons for their courses"
ON public.lessons FOR ALL
TO authenticated
USING (
  course_id IN (
    SELECT c.id
    FROM public.courses c
    JOIN public.profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
)
WITH CHECK (
  course_id IN (
    SELECT c.id
    FROM public.courses c
    JOIN public.profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Create RLS policies for enrollments
CREATE POLICY "Users can view their own enrollments"
ON public.enrollments FOR SELECT
TO authenticated
USING (student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can enroll in courses"
ON public.enrollments FOR INSERT
TO authenticated
WITH CHECK (student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can update their own enrollments"
ON public.enrollments FOR UPDATE
TO authenticated
USING (student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create RLS policies for lesson progress
CREATE POLICY "Users can view their own lesson progress"
ON public.lesson_progress FOR SELECT
TO authenticated
USING (
  enrollment_id IN (
    SELECT e.id
    FROM public.enrollments e
    JOIN public.profiles p ON e.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Students can update their own lesson progress"
ON public.lesson_progress FOR ALL
TO authenticated
USING (
  enrollment_id IN (
    SELECT e.id
    FROM public.enrollments e
    JOIN public.profiles p ON e.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
)
WITH CHECK (
  enrollment_id IN (
    SELECT e.id
    FROM public.enrollments e
    JOIN public.profiles p ON e.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();