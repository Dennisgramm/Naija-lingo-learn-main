


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."course_level" AS ENUM (
    'beginner',
    'intermediate',
    'advanced'
);


ALTER TYPE "public"."course_level" OWNER TO "postgres";


CREATE TYPE "public"."lesson_type" AS ENUM (
    'video',
    'text',
    'quiz'
);


ALTER TYPE "public"."lesson_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'student',
    'teacher',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_enrolled_course_teacher_ids"() RETURNS TABLE("teacher_id" "uuid")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT DISTINCT c.teacher_id
  FROM public.courses c
  JOIN public.enrollments e ON c.id = e.course_id
  JOIN public.profiles p ON e.student_id = p.id
  WHERE p.user_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_enrolled_course_teacher_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."user_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id AND role = _role
  )
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."user_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "language" "text" NOT NULL,
    "level" "public"."course_level" NOT NULL,
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "image_url" "text",
    "duration_weeks" integer DEFAULT 1 NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "enrolled_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "progress" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "enrollments_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100)))
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "enrollment_id" "uuid" NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "completed_at" timestamp with time zone,
    "watched_duration_seconds" integer DEFAULT 0
);


ALTER TABLE "public"."lesson_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "type" "public"."lesson_type" DEFAULT 'video'::"public"."lesson_type" NOT NULL,
    "video_url" "text",
    "content" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "duration_minutes" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "approval_status" "text" DEFAULT 'pending'::"text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    CONSTRAINT "lessons_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'student'::"public"."user_role" NOT NULL,
    "avatar_url" "text",
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quiz_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "score" integer NOT NULL,
    "answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "time_taken_seconds" integer
);


ALTER TABLE "public"."quiz_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quizzes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "questions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "passing_score" integer DEFAULT 70 NOT NULL,
    "time_limit_minutes" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quizzes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_course_id_key" UNIQUE ("student_id", "course_id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_enrollment_id_lesson_id_key" UNIQUE ("enrollment_id", "lesson_id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_lessons_approval_status" ON "public"."lessons" USING "btree" ("approval_status");



CREATE INDEX "idx_quiz_attempts_quiz_id" ON "public"."quiz_attempts" USING "btree" ("quiz_id");



CREATE INDEX "idx_quiz_attempts_student_id" ON "public"."quiz_attempts" USING "btree" ("student_id");



CREATE INDEX "idx_quizzes_lesson_id" ON "public"."quizzes" USING "btree" ("lesson_id");



CREATE OR REPLACE TRIGGER "update_courses_updated_at" BEFORE UPDATE ON "public"."courses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_lessons_updated_at" BEFORE UPDATE ON "public"."lessons" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_quizzes_updated_at" BEFORE UPDATE ON "public"."quizzes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can update lesson approval" ON "public"."lessons" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all lessons" ON "public"."lessons" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Anyone can view published courses" ON "public"."courses" FOR SELECT TO "authenticated" USING (("is_published" = true));



CREATE POLICY "Students can create their own quiz attempts" ON "public"."quiz_attempts" FOR INSERT WITH CHECK (("student_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Students can enroll in courses" ON "public"."enrollments" FOR INSERT TO "authenticated" WITH CHECK (("student_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Students can manage their quiz attempts" ON "public"."quiz_attempts" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "quiz_attempts"."student_id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "quiz_attempts"."student_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Students can update their own enrollments" ON "public"."enrollments" FOR UPDATE TO "authenticated" USING (("student_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Students can update their own lesson progress" ON "public"."lesson_progress" TO "authenticated" USING (("enrollment_id" IN ( SELECT "e"."id"
   FROM ("public"."enrollments" "e"
     JOIN "public"."profiles" "p" ON (("e"."student_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"())))) WITH CHECK (("enrollment_id" IN ( SELECT "e"."id"
   FROM ("public"."enrollments" "e"
     JOIN "public"."profiles" "p" ON (("e"."student_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"()))));



CREATE POLICY "Students can view all courses" ON "public"."courses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = "auth"."uid"()) AND ("profiles"."role" = 'student'::"public"."user_role")))));



CREATE POLICY "Students can view approved lessons from enrolled courses" ON "public"."lessons" FOR SELECT USING ((("approval_status" = 'approved'::"text") AND (("course_id" IN ( SELECT "e"."course_id"
   FROM ("public"."enrollments" "e"
     JOIN "public"."profiles" "p" ON (("e"."student_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"()))) OR ("course_id" IN ( SELECT "c"."id"
   FROM ("public"."courses" "c"
     JOIN "public"."profiles" "p" ON (("c"."teacher_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Students can view enrolled course teachers" ON "public"."profiles" FOR SELECT USING ((("role" = 'teacher'::"public"."user_role") AND ("id" IN ( SELECT "get_enrolled_course_teacher_ids"."teacher_id"
   FROM "public"."get_enrolled_course_teacher_ids"() "get_enrolled_course_teacher_ids"("teacher_id")))));



CREATE POLICY "Students can view quizzes for enrolled courses" ON "public"."quizzes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ((("public"."lessons" "l"
     JOIN "public"."courses" "c" ON (("l"."course_id" = "c"."id")))
     JOIN "public"."enrollments" "e" ON (("c"."id" = "e"."course_id")))
     JOIN "public"."profiles" "p" ON (("e"."student_id" = "p"."id")))
  WHERE (("l"."id" = "quizzes"."lesson_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Students can view quizzes from enrolled courses" ON "public"."quizzes" FOR SELECT USING ((("lesson_id" IN ( SELECT "l"."id"
   FROM ((("public"."lessons" "l"
     JOIN "public"."courses" "c" ON (("l"."course_id" = "c"."id")))
     JOIN "public"."enrollments" "e" ON (("c"."id" = "e"."course_id")))
     JOIN "public"."profiles" "p" ON (("e"."student_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"()))) OR ("lesson_id" IN ( SELECT "l"."id"
   FROM (("public"."lessons" "l"
     JOIN "public"."courses" "c" ON (("l"."course_id" = "c"."id")))
     JOIN "public"."profiles" "p" ON (("c"."teacher_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Students can view their own quiz attempts" ON "public"."quiz_attempts" FOR SELECT USING (("student_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Teachers can create courses" ON "public"."courses" FOR INSERT TO "authenticated" WITH CHECK (("teacher_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = "auth"."uid"()) AND ("profiles"."role" = 'teacher'::"public"."user_role")))));



CREATE POLICY "Teachers can manage lessons for their courses" ON "public"."lessons" TO "authenticated" USING (("course_id" IN ( SELECT "c"."id"
   FROM ("public"."courses" "c"
     JOIN "public"."profiles" "p" ON (("c"."teacher_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"())))) WITH CHECK (("course_id" IN ( SELECT "c"."id"
   FROM ("public"."courses" "c"
     JOIN "public"."profiles" "p" ON (("c"."teacher_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"()))));



CREATE POLICY "Teachers can manage quizzes for their courses" ON "public"."quizzes" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."lessons" "l"
     JOIN "public"."courses" "c" ON (("l"."course_id" = "c"."id")))
     JOIN "public"."profiles" "p" ON (("c"."teacher_id" = "p"."id")))
  WHERE (("l"."id" = "quizzes"."lesson_id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."lessons" "l"
     JOIN "public"."courses" "c" ON (("l"."course_id" = "c"."id")))
     JOIN "public"."profiles" "p" ON (("c"."teacher_id" = "p"."id")))
  WHERE (("l"."id" = "quizzes"."lesson_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Teachers can manage quizzes for their lessons" ON "public"."quizzes" USING (("lesson_id" IN ( SELECT "l"."id"
   FROM (("public"."lessons" "l"
     JOIN "public"."courses" "c" ON (("l"."course_id" = "c"."id")))
     JOIN "public"."profiles" "p" ON (("c"."teacher_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"())))) WITH CHECK (("lesson_id" IN ( SELECT "l"."id"
   FROM (("public"."lessons" "l"
     JOIN "public"."courses" "c" ON (("l"."course_id" = "c"."id")))
     JOIN "public"."profiles" "p" ON (("c"."teacher_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"()))));



CREATE POLICY "Teachers can update their own courses" ON "public"."courses" FOR UPDATE TO "authenticated" USING (("teacher_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Teachers can view quiz attempts for their courses" ON "public"."quiz_attempts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ((("public"."quizzes" "q"
     JOIN "public"."lessons" "l" ON (("q"."lesson_id" = "l"."id")))
     JOIN "public"."courses" "c" ON (("l"."course_id" = "c"."id")))
     JOIN "public"."profiles" "p" ON (("c"."teacher_id" = "p"."id")))
  WHERE (("q"."id" = "quiz_attempts"."quiz_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Teachers can view their own courses" ON "public"."courses" FOR SELECT TO "authenticated" USING (("teacher_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view teacher profiles" ON "public"."profiles" FOR SELECT USING (("role" = 'teacher'::"public"."user_role"));



CREATE POLICY "Users can view their own enrollments" ON "public"."enrollments" FOR SELECT TO "authenticated" USING (("student_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own lesson progress" ON "public"."lesson_progress" FOR SELECT TO "authenticated" USING (("enrollment_id" IN ( SELECT "e"."id"
   FROM ("public"."enrollments" "e"
     JOIN "public"."profiles" "p" ON (("e"."student_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quizzes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_enrolled_course_teacher_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_enrolled_course_teacher_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_enrolled_course_teacher_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."user_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."user_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."user_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_progress" TO "anon";
GRANT ALL ON TABLE "public"."lesson_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_progress" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_attempts" TO "anon";
GRANT ALL ON TABLE "public"."quiz_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."quizzes" TO "anon";
GRANT ALL ON TABLE "public"."quizzes" TO "authenticated";
GRANT ALL ON TABLE "public"."quizzes" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
