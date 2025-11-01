import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, AlertCircle, BookOpen, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { toast } from 'sonner';

const EditCourse = () => {
  const { courseId } = useParams();
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== 'teacher')) {
      navigate('/dashboard');
      return;
    }
    
    if (courseId) {
      fetchCourse();
    }
  }, [user, userProfile, loading, courseId, navigate]);

  const fetchCourse = async () => {
    if (!courseId) return;

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) {
      toast.error('Failed to load course');
      navigate('/dashboard');
      return;
    }

    // Check if user is the teacher of this course
    if (data.teacher_id !== userProfile?.id) {
      toast.error('You are not authorized to edit this course');
      navigate('/dashboard');
      return;
    }

    setCourse(data);
    setIsPublished(data.is_published);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!course || !userProfile) return;

    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const courseData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      language: formData.get('language') as string,
      level: formData.get('level') as 'beginner' | 'intermediate' | 'advanced',
      price: parseFloat(formData.get('price') as string) || 0,
      duration_weeks: parseInt(formData.get('duration_weeks') as string) || 1,
      is_published: isPublished,
    };

    const { error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', courseId);

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    toast.success('Course updated successfully!');
    navigate(`/course/${courseId}`);
  };

  const handleDelete = async () => {
    if (!course || !confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      toast.error('Failed to delete course');
      setSubmitting(false);
      return;
    }

    toast.success('Course deleted successfully');
    navigate('/dashboard');
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/course/${courseId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Course</h1>
              <p className="text-muted-foreground">Update your course details</p>
            </div>
          </div>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    defaultValue={course.title}
                    placeholder="e.g., Complete Yoruba for Beginners"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language *</Label>
                  <Select name="language" required defaultValue={course.language}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yoruba">Yoruba</SelectItem>
                      <SelectItem value="Igbo">Igbo</SelectItem>
                      <SelectItem value="Hausa">Hausa</SelectItem>
                      <SelectItem value="Pidgin">Pidgin English</SelectItem>
                      <SelectItem value="Fulfulde">Fulfulde</SelectItem>
                      <SelectItem value="Kanuri">Kanuri</SelectItem>
                      <SelectItem value="Tiv">Tiv</SelectItem>
                      <SelectItem value="Efik">Efik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level *</Label>
                  <Select name="level" required defaultValue={course.level}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_weeks">Duration (weeks) *</Label>
                  <Input
                    id="duration_weeks"
                    name="duration_weeks"
                    type="number"
                    min="1"
                    max="52"
                    defaultValue={course.duration_weeks}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="price">Price (₦)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={course.price}
                    placeholder="0 for free course"
                  />
                  <p className="text-sm text-muted-foreground">
                    Set to 0 to make this a free course
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    required
                    rows={5}
                    defaultValue={course.description}
                    placeholder="Describe what students will learn in this course..."
                  />
                </div>

                <div className="flex items-center space-x-2 md:col-span-2">
                  <Switch
                    id="is_published"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <Label htmlFor="is_published">
                    Publish course (make it visible to students)
                  </Label>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-primary"
                >
                  {submitting ? 'Updating...' : 'Update Course'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/course/${courseId}`)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="ml-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Course
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditCourse;