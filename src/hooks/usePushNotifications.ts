import { useState, useEffect } from 'react';
import { 
  PushNotifications, 
  PermissionStatus, 
  ActionPerformed,
  PushNotificationSchema,
  Token
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/components/ui/use-toast';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializePushNotifications = async () => {
      // Check if push notifications are supported
      if (Capacitor.isNativePlatform()) {
        setIsSupported(true);
        
        try {
          // Request permission
          const permission = await PushNotifications.requestPermissions();
          setPermissionStatus(permission);

          if (permission.receive === 'granted') {
            // Register for push notifications
            await PushNotifications.register();
          }

          // Listen for registration success
          await PushNotifications.addListener('registration', (token: Token) => {
            console.log('Push registration success, token: ' + token.value);
            setPushToken(token.value);
          });

          // Listen for registration errors
          await PushNotifications.addListener('registrationError', (error: any) => {
            console.error('Error on registration: ' + JSON.stringify(error));
            toast({
              title: "Notification Setup Failed",
              description: "Could not set up push notifications. Some features may be limited.",
              variant: "destructive",
            });
          });

          // Listen for push notifications received
          await PushNotifications.addListener(
            'pushNotificationReceived',
            (notification: PushNotificationSchema) => {
              console.log('Push notification received: ', notification);
              toast({
                title: notification.title || "Purposely Reminder",
                description: notification.body || "You have a new notification",
              });
            },
          );

          // Listen for push notification actions
          await PushNotifications.addListener(
            'pushNotificationActionPerformed',
            (notification: ActionPerformed) => {
              console.log('Push notification action performed', notification);
            },
          );

        } catch (error) {
          console.error('Error initializing push notifications:', error);
        }
      } else {
        // For web, we can show browser notifications as fallback
        setIsSupported(false);
      }
    };

    initializePushNotifications();
  }, [toast]);

  const scheduleLocalNotification = async (title: string, body: string, scheduledTime?: Date) => {
    if (!isSupported) {
      // Fallback to browser notification for web
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return;
    }

    try {
      // For now, we'll use browser notifications
      // In a real app, you'd use a push notification service
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const checkPermissions = async (): Promise<PermissionStatus | null> => {
    if (!isSupported) return null;
    
    try {
      const status = await PushNotifications.checkPermissions();
      setPermissionStatus(status);
      return status;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return null;
    }
  };

  return {
    isSupported,
    permissionStatus,
    pushToken,
    scheduleLocalNotification,
    checkPermissions
  };
};