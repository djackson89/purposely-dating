import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Heart, Sparkles } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface NotificationPermissionStepProps {
  onComplete: () => void;
  userProfile: any;
}

const NotificationPermissionStep: React.FC<NotificationPermissionStepProps> = ({ 
  onComplete, 
  userProfile 
}) => {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { permissionStatus, pushToken, checkPermissions } = usePushNotifications();
  const { toast } = useToast();

  useEffect(() => {
    // Check current permission status
    checkPermissions();
  }, []);

  useEffect(() => {
    if (permissionStatus?.receive === 'granted') {
      setIsPermissionGranted(true);
    }
  }, [permissionStatus]);

  useEffect(() => {
    // Save push token to user profile when available
    if (pushToken && userProfile) {
      savePushTokenToProfile(pushToken);
    }
  }, [pushToken, userProfile]);

  const savePushTokenToProfile = async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            push_token: token,
            notifications_enabled: true,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            ...userProfile
          });
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      // Request notification permissions
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setIsPermissionGranted(true);
          toast({
            title: "Notifications Enabled! 🔔",
            description: "You'll receive your daily relationship questions and reminders.",
          });
        } else {
          toast({
            title: "Notifications Disabled",
            description: "You can enable them later in your device settings.",
            variant: "destructive",
          });
        }
      }
      
      // Also check Capacitor permissions for mobile
      await checkPermissions();
    } catch (error) {
      console.error('Error requesting notifications:', error);
      toast({
        title: "Permission Error",
        description: "There was an issue setting up notifications.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipNotifications = () => {
    toast({
      title: "Notifications Skipped",
      description: "You can enable them anytime in your profile settings.",
    });
    onComplete();
  };

  const handleContinue = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-romance border-primary/20 animate-fade-in-up">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-romance rounded-full flex items-center justify-center shadow-glow">
            {isPermissionGranted ? (
              <Bell className="w-8 h-8 text-white animate-heart-pulse" />
            ) : (
              <BellOff className="w-8 h-8 text-white animate-heart-pulse" />
            )}
          </div>
          <CardTitle className="text-xl font-semibold bg-gradient-romance bg-clip-text text-transparent">
            Get Your Daily Dose of Relationship Growth 💕
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Receive personalized daily questions to strengthen your relationships and grow emotionally.
            </p>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
                <Heart className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-left">Daily relationship reflection questions</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-left">Personalized based on your love language</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
                <Bell className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-left">Gentle reminders at perfect timing</span>
              </div>
            </div>
          </div>

          {!isPermissionGranted ? (
            <div className="space-y-3">
              <Button 
                onClick={handleEnableNotifications}
                variant="romance"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Setting up..." : "Enable Notifications 🔔"}
              </Button>
              <Button 
                onClick={handleSkipNotifications}
                variant="ghost"
                className="w-full text-muted-foreground"
              >
                Skip for now
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">✅ Notifications are enabled!</p>
                <p className="text-green-600 text-sm mt-1">
                  You'll receive your first daily question tomorrow at 8 AM.
                </p>
              </div>
              <Button 
                onClick={handleContinue}
                variant="romance"
                size="lg"
                className="w-full"
              >
                Continue to Purposely 💕
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground/70">
            You can change notification preferences anytime in your profile.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPermissionStep;