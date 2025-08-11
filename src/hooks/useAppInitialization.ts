import { useEffect } from 'react';
import { useDevice } from './useDevice';
import { usePushNotifications } from './usePushNotifications';
import { useAnalytics } from './useAnalytics';
import { useHaptics } from './useHaptics';

export const useAppInitialization = (userProfile?: any) => {
  const { isNative, isOnline, setStatusBarStyle } = useDevice();
  const { isSupported: pushSupported, checkPermissions } = usePushNotifications();
  const { setUserProperties, trackScreenView } = useAnalytics();
  const { success } = useHaptics();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing Purposely Dating App...');
        console.log('📊 Device Info:', {
          isNative,
          isOnline,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown'
        });

        // Set status bar for native apps with iPad-specific handling
        if (isNative) {
          console.log('📱 Native platform detected');
          
          try {
            // Light status bar for the romance theme
            await setStatusBarStyle('Light' as any);
            console.log('✅ Status bar style set successfully');
          } catch (error) {
            console.warn('⚠️ Status bar setup failed:', error);
          }
          
          // Check push notification permissions with error handling
          if (pushSupported) {
            try {
              await checkPermissions();
              console.log('✅ Push notification permissions checked');
            } catch (error) {
              console.warn('⚠️ Push notification setup failed:', error);
            }
          }
          
          // Welcome haptic feedback with error handling
          try {
            setTimeout(() => {
              success();
            }, 500);
          } catch (error) {
            console.warn('⚠️ Haptic feedback failed:', error);
          }
        }
      } catch (error) {
        console.error('❌ App initialization error:', error);
        // Continue initialization even if some parts fail
      }

      // Set user properties for analytics
      if (userProfile) {
        setUserProperties({
          age: userProfile.age,
          gender: userProfile.gender,
          loveLanguage: userProfile.loveLanguage,
          relationshipStatus: userProfile.relationshipStatus,
          personalityType: userProfile.personalityType,
        });
      }

      // Track app initialization
      trackScreenView('app_launch', 'AppInitialization');

      // Start presence heartbeat every 30s (pause if tab hidden)
      try {
        const sendHeartbeat = async () => {
          if (typeof document !== 'undefined' && document.hidden) return;
          const { supabase } = await import('@/integrations/supabase/client');
          await supabase.functions.invoke('presence-heartbeat');
        };
        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 30000);
        // @ts-ignore store globally for cleanup on reloads
        window.__presenceInterval && clearInterval(window.__presenceInterval);
        // @ts-ignore
        window.__presenceInterval = interval;
      } catch (e) {
        console.warn('presence heartbeat init failed', e);
      }

      console.log('✅ App initialization complete');
    };

    initializeApp();
  }, [isNative, userProfile?.age, userProfile?.gender, userProfile?.loveLanguage, userProfile?.relationshipStatus, userProfile?.personalityType]);

  return {
    isNative,
    isOnline,
    pushSupported,
  };
};