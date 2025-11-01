import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, Play, FileText, HelpCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { VideoPlayer } from '@/components/VideoPlayer';
import { QuizViewer } from '@/components/QuizViewer';
import { toast } from 'sonner';

const LessonViewer = () => {
  const { courseId, lessonId } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [lessonProgress, setLessonProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchLessons();
      checkEnrollment();
    }
  }, [courseId]);

  useEffect(() => {
    if (lessonId && lessons.length > 0) {
      const lesson = lessons.find(l => l.id === lessonId);
      setCurrentLesson(lesson);
    }
  }, [lessonId, lessons]);

  useEffect(() => {
    if (enrollment) {
      fetchLessonProgress();
    }
  }, [enrollment]);

  // Fetch quiz questions when current lesson is a quiz
  useEffect(() => {
    if (currentLesson?.type === 'quiz' && currentLesson?.id) {
      fetchQuizQuestions();
    }
  }, [currentLesson]);

  const fetchQuizQuestions = async () => {
    if (!currentLesson?.id) return;
    
    try {
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', currentLesson.id)
        .single();

      if (error) {
        console.error('Error fetching quiz:', error);
        setQuizQuestions([]);
        return;
      }

      if (quiz?.questions && Array.isArray(quiz.questions)) {
        setQuizQuestions(quiz.questions as any[]);
      } else {
        setQuizQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      setQuizQuestions([]);
    }
  };

  const fetchCourse = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        profiles (full_name)
      `)
      .eq('id', courseId)
      .single();

    if (error) {
      toast.error('Course not found');
      navigate('/');
      return;
    }

    setCourse(data);
  };

  const fetchLessons = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');

    setLessons(data || []);
    setLoading(false);
  };

  const checkEnrollment = async () => {
    if (!userProfile) return;

    const { data } = await supabase
      .from('enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', userProfile.id)
      .single();

    if (!data && userProfile.role === 'student') {
      toast.error('You must be enrolled in this course to view lessons');
      navigate(`/course/${courseId}`);
      return;
    }

    setEnrollment(data);
  };

  const fetchLessonProgress = async () => {
    if (!enrollment) return;

    const { data } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('enrollment_id', enrollment.id);

    setLessonProgress(data || []);
  };

  const isLessonCompleted = (lessonId: string) => {
    return lessonProgress.some(p => p.lesson_id === lessonId && p.completed_at);
  };

  const markLessonComplete = async () => {
    if (!enrollment || !currentLesson) return;

    setMarkingComplete(true);

    // Check if progress already exists
    const existingProgress = lessonProgress.find(p => p.lesson_id === currentLesson.id);

    if (existingProgress) {
      // Update existing progress
      const { error } = await supabase
        .from('lesson_progress')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', existingProgress.id);

      if (error) {
        toast.error('Failed to mark lesson as complete');
        setMarkingComplete(false);
        return;
      }
    } else {
      // Create new progress record
      const { error } = await supabase
        .from('lesson_progress')
        .insert({
          enrollment_id: enrollment.id,
          lesson_id: currentLesson.id,
          completed_at: new Date().toISOString()
        });

      if (error) {
        toast.error('Failed to mark lesson as complete');
        setMarkingComplete(false);
        return;
      }
    }

    // Update overall course progress
    const completedCount = lessonProgress.filter(p => p.completed_at).length + 1;
    const progressPercentage = Math.round((completedCount / lessons.length) * 100);

    await supabase
      .from('enrollments')
      .update({ progress: progressPercentage })
      .eq('id', enrollment.id);

    toast.success('Lesson marked as complete!');
    fetchLessonProgress();
    setMarkingComplete(false);
  };

  const getCurrentLessonIndex = () => {
    return lessons.findIndex(l => l.id === currentLesson?.id);
  };

  const goToNextLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex < lessons.length - 1) {
      const nextLesson = lessons[currentIndex + 1];
      navigate(`/course/${courseId}/lesson/${nextLesson.id}`);
    }
  };

  const goToPreviousLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex > 0) {
      const prevLesson = lessons[currentIndex - 1];
      navigate(`/course/${courseId}/lesson/${prevLesson.id}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      case 'quiz': return <HelpCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const completedLessons = lessonProgress.filter(p => p.completed_at).length;
  const progressPercentage = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Lesson not found</p>
          <Button onClick={() => navigate(`/course/${courseId}`)} className="mt-4">
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => navigate(`/course/${courseId}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Button>
              
              {enrollment && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Progress: {completedLessons}/{lessons.length} lessons
                  </span>
                  <Progress value={progressPercentage} className="w-32" />
                </div>
              )}
            </div>

            {/* Lesson Content */}
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(currentLesson.type)}
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">{currentLesson.title}</h1>
                      <p className="text-muted-foreground">{course?.title}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{currentLesson.type}</Badge>
                    {currentLesson.duration_minutes && (
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {currentLesson.duration_minutes} min
                      </Badge>
                    )}
                    {isLessonCompleted(currentLesson.id) && (
                      <Badge className="bg-success text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
                
                {currentLesson.description && (
                  <p className="text-muted-foreground">{currentLesson.description}</p>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Video Player */}
                {currentLesson.video_url && (
                  <VideoPlayer
                    videoUrl={currentLesson.video_url}
                    title={currentLesson.title}
                    onProgress={(seconds) => {
                      // Update watch time in database
                      if (enrollment) {
                        supabase
                          .from('lesson_progress')
                          .upsert({
                            enrollment_id: enrollment.id,
                            lesson_id: currentLesson.id,
                            watched_duration_seconds: seconds
                          })
                          .then(() => {});
                      }
                    }}
                    onComplete={() => {
                      if (!isLessonCompleted(currentLesson.id)) {
                        markLessonComplete();
                      }
                    }}
                  />
                )}

                {/* Quiz Content - Updated to use QuizViewer */}
                {currentLesson.type === 'quiz' ? (
                  <div className="space-y-6">
                    <QuizViewer
                      questions={quizQuestions}
                      onComplete={(score) => {
                        toast.success(`Quiz completed with ${score}% score!`);
                        markLessonComplete();
                      }}
                    />
                  </div>
                ) : (
                  /* Text Content */
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {currentLesson.content}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {enrollment && (
                  <div className="flex items-center justify-between pt-6 border-t">
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={goToPreviousLesson}
                        disabled={getCurrentLessonIndex() === 0}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={goToNextLesson}
                        disabled={getCurrentLessonIndex() === lessons.length - 1}
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>

                    {!isLessonCompleted(currentLesson.id) && (
                      <Button
                        onClick={markLessonComplete}
                        disabled={markingComplete}
                        className="bg-success hover:bg-success/90"
                      >
                        {markingComplete ? 'Marking Complete...' : 'Mark as Complete'}
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Lesson List */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Lessons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => navigate(`/course/${courseId}/lesson/${lesson.id}`)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      lesson.id === currentLesson.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        isLessonCompleted(lesson.id)
                          ? 'bg-success text-white'
                          : lesson.id === currentLesson.id
                          ? 'bg-primary-foreground text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isLessonCompleted(lesson.id) ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          lesson.id === currentLesson.id ? '' : 'text-foreground'
                        }`}>
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs opacity-75">
                          {getTypeIcon(lesson.type)}
                          {lesson.duration_minutes && (
                            <span>{lesson.duration_minutes} min</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;