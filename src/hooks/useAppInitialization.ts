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
      console.log('🚀 Initializing Purposely Dating App...');

      // Set status bar for native apps
      if (isNative) {
        console.log('📱 Native platform detected');
        
        // Light status bar for the romance theme
        await setStatusBarStyle('Light' as any);
        
        // Check push notification permissions
        if (pushSupported) {
          await checkPermissions();
        }
        
        // Welcome haptic feedback
        setTimeout(() => {
          success();
        }, 500);
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