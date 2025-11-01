import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { toast } from 'sonner';

const CreateCourse = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== 'teacher')) {
      navigate('/dashboard');
    }
  }, [user, userProfile, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userProfile) return;

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
      teacher_id: userProfile.id,
    };

    const { data, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single();

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    toast.success('Course created successfully!');
    navigate(`/course/${data.id}`);
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

  if (!user || userProfile?.role !== 'teacher') return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Course</h1>
              <p className="text-muted-foreground">Share your language knowledge with students</p>
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
                    placeholder="e.g., Complete Yoruba for Beginners"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language *</Label>
                  <Select name="language" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yoruba">Yoruba</SelectItem>
                      <SelectItem value="Igbo">Igbo</SelectItem>
                      <SelectItem value="Hausa">Hausa</SelectItem>
                      <SelectItem value="Pidgin">Pidgin English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level *</Label>
                  <Select name="level" required>
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
                    defaultValue="8"
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
                    defaultValue="0"
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
                    placeholder="Describe what students will learn in this course..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-primary"
                >
                  {submitting ? 'Creating...' : 'Create Course'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateCourse;