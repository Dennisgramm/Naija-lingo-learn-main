import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle, Clock, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface EnrollmentButtonProps {
  courseId: string;
  courseName: string;
  price: number;
  isPublished: boolean;
  onEnrollmentChange?: () => void;
}

export const EnrollmentButton = ({ 
  courseId, 
  courseName, 
  price, 
  isPublished,
  onEnrollmentChange 
}: EnrollmentButtonProps) => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentCount, setEnrollmentCount] = useState(0);

  useEffect(() => {
    if (user && userProfile) {
      checkEnrollment();
      getEnrollmentCount();
    } else {
      setLoading(false);
    }
  }, [user, userProfile, courseId]);

  const checkEnrollment = async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_id', userProfile.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setEnrollment(data);
    } catch (error: any) {
      console.error('Error checking enrollment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEnrollmentCount = async () => {
    try {
      const { count, error } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      if (error) throw error;
      setEnrollmentCount(count || 0);
    } catch (error: any) {
      console.error('Error getting enrollment count:', error);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please sign in to enroll');
      navigate('/auth');
      return;
    }

    if (!userProfile || userProfile.role !== 'student') {
      toast.error('Only students can enroll in courses');
      return;
    }

    if (!isPublished) {
      toast.error('This course is not yet published');
      return;
    }

    setEnrolling(true);

    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          course_id: courseId,
          student_id: userProfile.id,
          progress: 0
        });

      if (error) throw error;

      toast.success(`Successfully enrolled in ${courseName}!`);
      checkEnrollment();
      getEnrollmentCount();
      onEnrollmentChange?.();
    } catch (error: any) {
      console.error('Enrollment error:', error);
      if (error.code === '23505') {
        toast.error('You are already enrolled in this course');
      } else {
        toast.error('Failed to enroll in course');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleContinue = () => {
    navigate(`/course/${courseId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // If user is not signed in
  if (!user) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{enrollmentCount} students enrolled</span>
        </div>
        <Button 
          onClick={() => navigate('/auth')} 
          className="w-full bg-gradient-primary"
          disabled={!isPublished}
        >
          {!isPublished ? 'Not Published' : price > 0 ? `Enroll for ₦${price}` : 'Enroll for Free'}
        </Button>
        {!isPublished && (
          <p className="text-xs text-muted-foreground text-center">
            This course is not yet available for enrollment
          </p>
        )}
      </div>
    );
  }

  // If user is a teacher
  if (userProfile?.role === 'teacher') {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{enrollmentCount} students enrolled</span>
        </div>
        <Badge variant="secondary" className="w-full justify-center py-2">
          <BookOpen className="w-4 h-4 mr-2" />
          Teacher View
        </Badge>
      </div>
    );
  }

  // If user is enrolled
  if (enrollment) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{enrollmentCount} students enrolled</span>
          </div>
          <Badge variant="secondary" className="bg-success/10 text-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Enrolled
          </Badge>
        </div>
        
        {enrollment.progress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{enrollment.progress}%</span>
            </div>
            <Progress value={enrollment.progress} className="h-2" />
          </div>
        )}

        <Button 
          onClick={handleContinue}
          className="w-full bg-gradient-primary"
        >
          {enrollment.progress > 0 ? (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Continue Learning
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4 mr-2" />
              Start Course
            </>
          )}
        </Button>

        {enrollment.completed_at && (
          <Badge variant="secondary" className="w-full justify-center py-2 bg-success/10 text-success">
            <CheckCircle className="w-4 h-4 mr-2" />
            Completed on {new Date(enrollment.completed_at).toLocaleDateString()}
          </Badge>
        )}
      </div>
    );
  }

  // If user is not enrolled
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>{enrollmentCount} students enrolled</span>
      </div>
      
      <Button 
        onClick={handleEnroll}
        disabled={enrolling || !isPublished}
        className="w-full bg-gradient-primary"
      >
        {enrolling ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Enrolling...
          </>
        ) : !isPublished ? (
          'Not Published'
        ) : price > 0 ? (
          `Enroll for ₦${price.toLocaleString()}`
        ) : (
          'Enroll for Free'
        )}
      </Button>

      {!isPublished && (
        <p className="text-xs text-muted-foreground text-center">
          This course is not yet available for enrollment
        </p>
      )}
    </div>
  );
};