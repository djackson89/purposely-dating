import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const useHaptics = () => {
  const isSupported = Capacitor.isNativePlatform();

  const impact = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (!isSupported) return;
    
    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  };

  const notification = async (type: NotificationType = NotificationType.Success) => {
    if (!isSupported) return;
    
    try {
      await Haptics.notification({ type });
    } catch (error) {
      console.warn('Haptic notification failed:', error);
    }
  };

  const vibrate = async (duration: number = 300) => {
    if (!isSupported) return;
    
    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.warn('Haptic vibration failed:', error);
    }
  };

  // Convenience methods for common UI interactions
  const light = () => impact(ImpactStyle.Light);
  const medium = () => impact(ImpactStyle.Medium);
  const heavy = () => impact(ImpactStyle.Heavy);
  
  const success = () => notification(NotificationType.Success);
  const warning = () => notification(NotificationType.Warning);
  const error = () => notification(NotificationType.Error);

  return {
    isSupported,
    impact,
    notification,
    vibrate,
    // Convenience methods
    light,
    medium,
    heavy,
    success,
    warning,
    error,
  };
};