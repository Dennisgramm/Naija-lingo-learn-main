import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, BookOpen, Users, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';

const Dashboard = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0, totalEnrollments: 0 });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData();
    }
  }, [userProfile]);

  const fetchDashboardData = async () => {
    if (!userProfile) return;

    if (userProfile.role === 'teacher') {
      // Fetch teacher's courses
      const { data: teacherCourses } = await supabase
        .from('courses')
        .select(`
          *,
          lessons (count),
          enrollments (count)
        `)
        .eq('teacher_id', userProfile.id);
      
      setCourses(teacherCourses || []);
      
      // Calculate stats for teacher
      const totalStudents = teacherCourses?.reduce((sum, course) => sum + (course.enrollments?.[0]?.count || 0), 0) || 0;
      setStats({
        totalCourses: teacherCourses?.length || 0,
        totalStudents,
        totalEnrollments: totalStudents
      });
    } else {
      // Fetch student's enrollments
      const { data: studentEnrollments } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            *,
            profiles (full_name)
          )
        `)
        .eq('student_id', userProfile.id);
      
      setEnrollments(studentEnrollments || []);
      
      // Calculate completion stats
      const completed = studentEnrollments?.filter(e => e.progress === 100).length || 0;
      setStats({
        totalCourses: studentEnrollments?.length || 0,
        totalStudents: completed,
        totalEnrollments: studentEnrollments?.length || 0
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {userProfile.full_name}!
          </h1>
          <p className="text-muted-foreground">
            {userProfile.role === 'teacher' 
              ? 'Manage your courses and track student progress'
              : 'Continue your language learning journey'
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userProfile.role === 'teacher' ? 'Total Courses' : 'Enrolled Courses'}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userProfile.role === 'teacher' ? 'Total Students' : 'Completed Courses'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userProfile.role === 'teacher' 
                  ? `${stats.totalEnrollments} enrollments`
                  : `${Math.round((stats.totalStudents / Math.max(stats.totalCourses, 1)) * 100)}%`
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teacher Dashboard */}
        {userProfile.role === 'teacher' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Your Courses</h2>
              <Button onClick={() => navigate('/create-course')} className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create New Course
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-medium transition-shadow cursor-pointer"
                      onClick={() => navigate(`/course/${course.id}`)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{course.language}</Badge>
                      <Badge variant={course.is_published ? "default" : "outline"}>
                        {course.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{course.lessons?.[0]?.count || 0} lessons</span>
                      <span>{course.enrollments?.[0]?.count || 0} students</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {courses.length === 0 && (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Create your first course to start teaching and sharing your knowledge
                    </p>
                    <Button onClick={() => navigate('/create-course')} className="bg-gradient-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Course
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Student Dashboard */}
        {userProfile.role === 'student' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Your Courses</h2>
              <Button onClick={() => navigate('/?scrollTo=courses')} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Browse More Courses
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="hover:shadow-medium transition-shadow cursor-pointer"
                      onClick={() => navigate(`/course/${enrollment.courses.id}`)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{enrollment.courses.language}</Badge>
                      <Badge variant="outline">{enrollment.courses.level}</Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{enrollment.courses.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                      {enrollment.courses.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{enrollment.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        by {enrollment.courses.profiles.full_name}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {enrollments.length === 0 && (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No enrolled courses</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Start your language learning journey by enrolling in a course
                    </p>
                    <Button onClick={() => navigate('/?scrollTo=courses')} className="bg-gradient-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Browse Courses
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;