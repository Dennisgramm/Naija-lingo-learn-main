import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Mail, Edit, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { toast } from 'sonner';

const Profile = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url || ''
      });
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userProfile) return;

    setSubmitting(true);
    setError(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        bio: formData.bio,
        avatar_url: formData.avatar_url || null
      })
      .eq('id', userProfile.id);

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    toast.success('Profile updated successfully!');
    setEditing(false);
    setSubmitting(false);
    
    // Refresh the page to get updated profile
    window.location.reload();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
              <p className="text-muted-foreground">Manage your account information</p>
            </div>
            
            {!editing && (
              <Button onClick={() => setEditing(true)} className="bg-gradient-primary">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                  {userProfile.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    userProfile.full_name.charAt(0).toUpperCase()
                  )}
                </div>
                
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {userProfile.full_name}
                </h2>
                
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
                
                <Badge 
                  className={
                    userProfile.role === 'teacher' 
                      ? 'bg-accent text-accent-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }
                >
                  <User className="w-3 h-3 mr-1" />
                  {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                </Badge>

                {userProfile.bio && (
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                    {userProfile.bio}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Member since</p>
                  <p className="text-sm">
                    {new Date(userProfile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last updated</p>
                  <p className="text-sm">
                    {new Date(userProfile.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {editing ? 'Edit Profile' : 'Profile Information'}
                  </CardTitle>
                  
                  {editing && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditing(false);
                        setError(null);
                        // Reset form data
                        setFormData({
                          full_name: userProfile.full_name || '',
                          bio: userProfile.bio || '',
                          avatar_url: userProfile.avatar_url || ''
                        });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    {editing ? (
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        required
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-foreground">{userProfile.full_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <p className="text-muted-foreground text-sm">
                      {user.email}
                      <span className="ml-2 text-xs">(Cannot be changed)</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <p className="text-muted-foreground text-sm">
                      {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                      <span className="ml-2 text-xs">(Cannot be changed)</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar_url">Avatar URL</Label>
                    {editing ? (
                      <Input
                        id="avatar_url"
                        type="url"
                        value={formData.avatar_url}
                        onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                        placeholder="https://example.com/your-photo.jpg"
                      />
                    ) : (
                      <p className="text-foreground">
                        {userProfile.avatar_url || 'No avatar set'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    {editing ? (
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={4}
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-foreground">
                        {userProfile.bio || 'No bio provided'}
                      </p>
                    )}
                  </div>

                  {editing && (
                    <div className="flex gap-4 pt-6">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-gradient-primary"
                      >
                        {submitting ? 'Saving...' : 'Save Changes'}
                        <Save className="w-4 h-4 ml-2" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditing(false);
                          setError(null);
                        }}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;