import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, Clock, BookOpen, Users, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'course_enrollment' | 'lesson_completed' | 'achievement' | 'course_updated' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

export const NotificationCenter = () => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userProfile) {
      fetchNotifications();
      // Set up real-time subscription
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`
        }, (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.info('New notification received');
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [userProfile]);

  const fetchNotifications = async () => {
    if (!userProfile) return;

    // Mock notifications for demo
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'course_enrollment',
        title: 'New Course Enrollment',
        message: 'John Doe enrolled in your "Complete Yoruba for Beginners" course',
        read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        action_url: '/dashboard'
      },
      {
        id: '2',
        type: 'lesson_completed',
        title: 'Lesson Completed',
        message: 'You completed "Basic Greetings" in the Yoruba course',
        read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        id: '3',
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: 'You earned the "First Week" badge for completing 7 days of lessons',
        read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      },
      {
        id: '4',
        type: 'course_updated',
        title: 'Course Update',
        message: 'New lessons added to "Hausa Conversation Mastery"',
        read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        action_url: '/course/3'
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    toast.success('All notifications marked as read');
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    toast.success('Notification deleted');
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'course_enrollment':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'lesson_completed':
        return <BookOpen className="w-5 h-5 text-green-600" />;
      case 'achievement':
        return <Award className="w-5 h-5 text-yellow-600" />;
      case 'course_updated':
        return <Bell className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="px-2 py-1 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-3 p-3">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted rounded h-4 w-3/4" />
                    <div className="bg-muted rounded h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex gap-3 p-3 rounded-lg transition-colors ${
                  !notification.read
                    ? 'bg-primary/5 border border-primary/20'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs h-6 px-2"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Mark read
                      </Button>
                    )}
                    
                    {notification.action_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.location.href = notification.action_url!}
                        className="text-xs h-6 px-2 text-primary hover:text-primary"
                      >
                        View
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-xs h-6 px-2 text-destructive hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};