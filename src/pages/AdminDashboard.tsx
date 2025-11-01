import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, Clock, Play, FileText, HelpCircle, Eye, Search, Filter, Users, BookOpen, GraduationCap, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ 
    pending: 0, 
    approved: 0, 
    rejected: 0,
    totalCourses: 0,
    totalUsers: 0,
    totalEnrollments: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!loading && (!userProfile || userProfile.role !== 'admin')) {
      navigate('/dashboard');
    }
  }, [userProfile, loading, navigate]);

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchAllData();
    }
  }, [userProfile]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchLessons(),
      fetchCourses(),
      fetchUsers(),
      fetchStats()
    ]);
    setIsLoading(false);
  };

  const fetchLessons = async () => {
    const { data } = await supabase
      .from('lessons')
      .select(`
        *,
        courses (
          title,
          language,
          profiles (full_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setLessons(data);
    }
  };

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select(`
        *,
        profiles (full_name),
        enrollments (count)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setCourses(data);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setUsers(data);
    }
  };

  const fetchStats = async () => {
    // Get lesson stats
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('approval_status');

    // Get course count
    const { count: courseCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    // Get user count
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get enrollment count
    const { count: enrollmentCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true });

    if (lessonData) {
      const pending = lessonData.filter(l => l.approval_status === 'pending').length;
      const approved = lessonData.filter(l => l.approval_status === 'approved').length;
      const rejected = lessonData.filter(l => l.approval_status === 'rejected').length;
      
      setStats({ 
        pending, 
        approved, 
        rejected,
        totalCourses: courseCount || 0,
        totalUsers: userCount || 0,
        totalEnrollments: enrollmentCount || 0
      });
    }
  };

  const handleApproval = async (lessonId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('lessons')
      .update({
        approval_status: status,
        approved_by: userProfile?.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', lessonId);

    if (error) {
      toast.error('Failed to update lesson status');
      return;
    }

    toast.success(`Lesson ${status} successfully`);
    fetchAllData();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      case 'quiz': return <HelpCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="text-emerald-600 border-emerald-200 bg-emerald-50"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-red-600 border-red-200 bg-red-50"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.courses?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.courses?.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lesson.approval_status === statusFilter;
    const matchesType = typeFilter === 'all' || lesson.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage and oversee your entire learning platform
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">Pending Approval</CardTitle>
              <Clock className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700">{stats.pending}</div>
              <p className="text-xs text-amber-600 mt-1">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Approved</CardTitle>
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700">{stats.approved}</div>
              <p className="text-xs text-emerald-600 mt-1">Live lessons</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Rejected</CardTitle>
              <XCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">{stats.rejected}</div>
              <p className="text-xs text-red-600 mt-1">Need revision</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Courses</CardTitle>
              <BookOpen className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{stats.totalCourses}</div>
              <p className="text-xs text-blue-600 mt-1">Active courses</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Total Users</CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">{stats.totalUsers}</div>
              <p className="text-xs text-purple-600 mt-1">Registered users</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-800">Enrollments</CardTitle>
              <GraduationCap className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-700">{stats.totalEnrollments}</div>
              <p className="text-xs text-indigo-600 mt-1">Active enrollments</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Management Tabs */}
        <Tabs defaultValue="lessons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger value="lessons" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Lesson Management
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Course Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-6">
            {/* Enhanced Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search lessons, courses, or teachers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Lessons List */}
            <div className="space-y-4">
              {filteredLessons.map((lesson) => (
                <Card key={lesson.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-muted rounded-full">
                          {getTypeIcon(lesson.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground text-lg">{lesson.title}</h3>
                            {getStatusBadge(lesson.approval_status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              <span>Course: {lesson.courses?.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>Teacher: {lesson.courses?.profiles?.full_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {lesson.courses?.language}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {lesson.type}
                              </Badge>
                            </div>
                            {lesson.duration_minutes && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{lesson.duration_minutes} minutes</span>
                              </div>
                            )}
                          </div>
                          {lesson.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2 italic">
                              "{lesson.description}"
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/lesson/${lesson.id}`)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>

                        {lesson.approval_status === 'pending' && (
                          <div className="flex gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Approve Lesson</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to approve "{lesson.title}"? 
                                    This will make it visible to students enrolled in the course.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleApproval(lesson.id, 'approved')}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    Approve Lesson
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Lesson</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject "{lesson.title}"? 
                                    This will prevent it from being visible to students and may require the teacher to make revisions.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleApproval(lesson.id, 'rejected')}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Reject Lesson
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredLessons.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Activity className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No lessons found</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                        ? 'No lessons match your current filters. Try adjusting your search criteria.'
                        : 'No lessons have been created yet that require approval.'
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid gap-4">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground text-lg">{course.title}</h3>
                          <Badge variant={course.is_published ? "default" : "outline"}>
                            {course.is_published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <span>Teacher: {course.profiles?.full_name}</span>
                          <span>Language: {course.language}</span>
                          <span>Level: {course.level}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{course.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Course
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                          {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{user.full_name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={user.role === 'admin' ? 'default' : user.role === 'teacher' ? 'secondary' : 'outline'}>
                              {user.role}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Joined {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {user.bio && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{user.bio}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;