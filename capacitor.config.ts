import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.derrick.purposely.dating',
  appName: 'Purposely',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://a3b2c442-d1f6-40d1-a4a5-f981d6acd20c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    infoPlist: {
      NSPhotoLibraryUsageDescription: 'Purposely accesses your photo library to allow you to select and upload photos for your dating profile, enhance your profile pictures, and share meaningful moments through the app.',
      NSCameraUsageDescription: 'Purposely uses your camera to take photos for your dating profile and to capture moments you want to share through the app.',
      NSPhotoLibraryAddUsageDescription: 'Purposely needs access to save photos to your photo library when you download or save images from the app.',
      NSFaceIDUsageDescription: 'Purposely uses Face ID for secure and convenient authentication to protect your privacy and personal information.',
      NSUserTrackingUsageDescription: 'Purposely uses data for analytics to improve your dating experience and provide personalized recommendations.',
      NSLocationWhenInUseUsageDescription: 'Purposely may use your location to help you find compatible matches in your area and enhance your dating experience.',
      NSMicrophoneUsageDescription: 'Purposely may use your microphone for voice messages and audio features within the app.',
      NSContactsUsageDescription: 'Purposely may access your contacts to help you find friends who are also using the app.',
      NSCalendarsUsageDescription: 'Purposely may access your calendar to help schedule dates and relationship activities.',
      NSRemindersUsageDescription: 'Purposely may access your reminders to help you stay on top of important relationship milestones and dates.',
      NSMotionUsageDescription: 'Purposely may use motion data to enhance user experience and provide gesture-based interactions.',
      NSBluetoothPeripheralUsageDescription: 'Purposely may use Bluetooth to connect with compatible devices for enhanced app functionality.',
      NSAppleMusicUsageDescription: 'Purposely may access your music library to help you share music preferences and discover compatibility with potential matches.',
      NSHealthShareUsageDescription: 'Purposely may access your health data to provide wellness-focused dating insights and compatibility matching.',
      NSHealthUpdateUsageDescription: 'Purposely may update your health data to track relationship wellness and personal growth metrics.'
    }
  }
};

export default config;