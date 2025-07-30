import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  Shield, 
  Fingerprint, 
  Smartphone, 
  Globe, 
  Camera,
  Vibrate,
  Moon,
  Sun,
  Settings as SettingsIcon
} from 'lucide-react';
import { useDevice } from '@/hooks/useDevice';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useHaptics } from '@/hooks/useHaptics';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AppSettingsProps {
  onClose: () => void;
}

const AppSettings: React.FC<AppSettingsProps> = ({ onClose }) => {
  const { isNative, isOnline, connectionType } = useDevice();
  const { isSupported: pushSupported, permissionStatus } = usePushNotifications();
  const { isAvailable: biometricAvailable, isBiometricEnabled, enableBiometricAuth, disableBiometricAuth } = useBiometricAuth();
  const { isSupported: hapticsSupported, success, medium } = useHaptics();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    pushNotifications: permissionStatus?.receive === 'granted',
    biometricAuth: isBiometricEnabled(),
    hapticFeedback: hapticsSupported,
    darkMode: localStorage.getItem('theme') === 'dark',
    analyticsOptOut: localStorage.getItem('analytics_opt_out') === 'true',
  });

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    medium(); // Haptic feedback for setting change
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await enableBiometricAuth();
      updateSetting('biometricAuth', success);
    } else {
      disableBiometricAuth();
      updateSetting('biometricAuth', false);
    }
  };

  const handleHapticTest = () => {
    success();
    toast({
      title: "Haptic Test",
      description: "Did you feel that vibration?",
    });
  };

  const toggleTheme = (isDark: boolean) => {
    updateSetting('darkMode', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    // In a real app, you'd implement theme switching
    toast({
      title: "Theme Updated",
      description: `Switched to ${isDark ? 'dark' : 'light'} mode.`,
    });
  };

  const toggleAnalytics = (optOut: boolean) => {
    updateSetting('analyticsOptOut', optOut);
    localStorage.setItem('analytics_opt_out', optOut ? 'true' : 'false');
    toast({
      title: optOut ? "Analytics Disabled" : "Analytics Enabled",
      description: optOut ? "Your usage data will not be collected." : "Anonymous usage data will help improve the app.",
    });
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    updateSetting('pushNotifications', enabled);
    
    // Update notification preference in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ notifications_enabled: enabled })
          .eq('id', user.id);
        
        toast({
          title: enabled ? "Notifications Enabled" : "Notifications Disabled",
          description: enabled 
            ? "You'll receive daily relationship questions and reminders." 
            : "You won't receive any push notifications.",
        });
      }
    } catch (error) {
      console.error('Error updating notification preference:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <span>App Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Device Info */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Device Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Platform:</span>
                <span className="text-muted-foreground">{isNative ? 'Mobile' : 'Web'}</span>
              </div>
              <div className="flex justify-between">
                <span>Connection:</span>
                <div className="flex items-center space-x-1">
                  <Globe className={`w-3 h-3 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-muted-foreground">
                    {isOnline ? connectionType : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Notifications</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <Label htmlFor="push-notifications">Push Notifications</Label>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={handleNotificationToggle}
                disabled={!pushSupported}
              />
            </div>
            
            {!pushSupported && (
              <p className="text-xs text-muted-foreground">
                Push notifications are not supported on this platform.
              </p>
            )}
            
            {settings.pushNotifications && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={async () => {
                  try {
                    const response = await fetch('https://csupviqxprhtrbfbugct.supabase.co/functions/v1/daily-question-notification', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ test: true })
                    });
                    
                    if (response.ok) {
                      toast({
                        title: "Test Notification Sent! 📱",
                        description: "Check if you received a test notification.",
                      });
                    } else {
                      throw new Error('Failed to send test notification');
                    }
                  } catch (error) {
                    console.error('Error sending test notification:', error);
                    toast({
                      title: "Test Failed",
                      description: "Could not send test notification. Check console for details.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Send Test Notification 🔔
              </Button>
            )}
          </div>

          {/* Security */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Security</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Fingerprint className="w-4 h-4" />
                <Label htmlFor="biometric-auth">Biometric Authentication</Label>
              </div>
              <Switch
                id="biometric-auth"
                checked={settings.biometricAuth}
                onCheckedChange={handleBiometricToggle}
                disabled={!biometricAvailable}
              />
            </div>
            
            {!biometricAvailable && (
              <p className="text-xs text-muted-foreground">
                Biometric authentication is not available on this device.
              </p>
            )}
          </div>

          {/* Experience */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Experience</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Vibrate className="w-4 h-4" />
                <Label htmlFor="haptic-feedback">Haptic Feedback</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="haptic-feedback"
                  checked={settings.hapticFeedback}
                  onCheckedChange={(checked) => updateSetting('hapticFeedback', checked)}
                  disabled={!hapticsSupported}
                />
                {hapticsSupported && (
                  <Button variant="outline" size="sm" onClick={handleHapticTest}>
                    Test
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <Label htmlFor="dark-mode">Dark Mode</Label>
              </div>
              <Switch
                id="dark-mode"
                checked={settings.darkMode}
                onCheckedChange={toggleTheme}
              />
            </div>
          </div>

          {/* Privacy */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Privacy</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <Label htmlFor="analytics-opt-out">Disable Analytics</Label>
              </div>
              <Switch
                id="analytics-opt-out"
                checked={settings.analyticsOptOut}
                onCheckedChange={toggleAnalytics}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t">
            <Button onClick={onClose} className="w-full">
              Close Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppSettings;