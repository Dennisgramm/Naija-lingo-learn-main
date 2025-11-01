import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, Clock, Users, Star, Play, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { toast } from 'sonner';

const CourseDetail = () => {
  const { courseId } = useParams();
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchLessons();
    }
  }, [courseId]);

  useEffect(() => {
    if (course && userProfile) {
      checkEnrollment();
    }
  }, [course, userProfile]);

  const fetchCourse = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        profiles (full_name, avatar_url, bio)
      `)
      .eq('id', courseId)
      .maybeSingle();

    if (error || !data) {
      toast.error('Course not found');
      navigate('/');
      return;
    }

    setCourse(data);
    setCourseLoading(false);
  };

  const fetchLessons = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');

    setLessons(data || []);
  };

  const checkEnrollment = async () => {
    if (!userProfile || userProfile.role !== 'student') return;

    const { data } = await supabase
      .from('enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', userProfile.id)
      .single();

    setEnrollment(data);
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!userProfile || userProfile.role !== 'student') {
      toast.error('Only students can enroll in courses');
      return;
    }

    setEnrolling(true);

    const { error } = await supabase
      .from('enrollments')
      .insert({
        course_id: courseId,
        student_id: userProfile.id,
      });

    if (error) {
      toast.error('Failed to enroll in course');
    } else {
      toast.success('Successfully enrolled in course!');
      checkEnrollment();
    }

    setEnrolling(false);
  };

  if (loading || courseLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const isOwner = userProfile?.id === course.teacher_id;
  const isEnrolled = !!enrollment;
  const canAccessLessons = isOwner || isEnrolled;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <Card className="shadow-medium">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{course.language}</Badge>
                  <Badge variant="outline">{course.level}</Badge>
                  {course.price === 0 && <Badge className="bg-success text-white">Free</Badge>}
                  {!course.is_published && (
                    <Badge variant="destructive" className="bg-orange-500">
                      Draft - Not Published
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
                
                <div className="flex items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration_weeks} weeks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{lessons.length} lessons</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-secondary text-secondary" />
                    <span>4.9</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center gap-3 mb-6 pb-6 border-b">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                    {course.profiles.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{course.profiles.full_name}</p>
                    <p className="text-sm text-muted-foreground">Course Instructor</p>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {course.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Course Content */}
            <Tabs defaultValue="lessons" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lessons">Lessons</TabsTrigger>
                <TabsTrigger value="instructor">Instructor</TabsTrigger>
              </TabsList>

              <TabsContent value="lessons" className="space-y-4">
                <Card className="shadow-medium">
                  <CardHeader>
                    <CardTitle>Course Curriculum</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lessons.length > 0 ? (
                      lessons.map((lesson, index) => (
                        <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">{lesson.title}</h4>
                              {lesson.description && (
                                <p className="text-sm text-muted-foreground">{lesson.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {lesson.duration_minutes && (
                              <span className="text-sm text-muted-foreground">
                                {lesson.duration_minutes} min
                              </span>
                            )}
                            {canAccessLessons ? (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => navigate(`/course/${courseId}/lesson/${lesson.id}`)}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No lessons available yet</p>
                        {isOwner && (
                          <p className="text-sm mt-2">
                            <Link to={`/course/${courseId}/lessons`} className="text-primary hover:underline">
                              Add lessons to your course
                            </Link>
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="instructor">
                <Card className="shadow-medium">
                  <CardHeader>
                    <CardTitle>About the Instructor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {course.profiles.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{course.profiles.full_name}</h3>
                        {course.profiles.bio ? (
                          <p className="text-muted-foreground">{course.profiles.bio}</p>
                        ) : (
                          <p className="text-muted-foreground">
                            Experienced language instructor passionate about teaching Nigerian languages.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-large">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {course.price === 0 ? 'Free' : `₦${course.price.toLocaleString()}`}
                  </div>
                  <p className="text-muted-foreground">Full course access</p>
                </div>

                {!user ? (
                  <Button 
                    className="w-full bg-gradient-primary"
                    onClick={() => navigate('/auth')}
                  >
                    Sign Up to Enroll
                  </Button>
                ) : isOwner ? (
                  <div className="space-y-3">
                    <Button 
                      className="w-full mb-2"
                      variant="outline"
                      onClick={() => navigate(`/course/${courseId}/lessons`)}
                    >
                      Manage Lessons
                    </Button>
                    <Button 
                      className="w-full"
                      variant="outline"
                      onClick={() => navigate(`/course/${courseId}/edit`)}
                    >
                      Edit Course
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      This is your course
                    </p>
                  </div>
                ) : userProfile?.role !== 'student' ? (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Switch to student account to enroll
                    </p>
                  </div>
                ) : isEnrolled ? (
                  <div className="space-y-3">
                    <Button className="w-full bg-success hover:bg-success/90" disabled>
                      ✓ Enrolled
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      You have access to all lessons
                    </p>
                  </div>
                ) : (
                  <Button 
                    className="w-full bg-gradient-primary"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </Button>
                )}

                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{course.duration_weeks} weeks duration</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span>{lessons.length} video lessons</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>Learn at your own pace</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;