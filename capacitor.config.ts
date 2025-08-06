
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
      NSPhotoLibraryUsageDescription: 'This app needs access to your photo library to help you select and enhance photos for your dating profile. You can choose existing photos to upload as profile pictures and use our background removal feature to create better dating photos.',
      NSCameraUsageDescription: 'This app uses your camera to take new profile pictures and capture conversation screenshots that you can analyze with our AI relationship coach.',
      NSPhotoLibraryAddUsageDescription: 'This app saves processed images (such as background-removed photos) to your photo library so you can use them in your dating profiles.',
      NSFaceIDUsageDescription: 'This app uses Face ID for secure authentication to protect your privacy and personal information.',
      NSUserTrackingUsageDescription: 'This app uses tracking data to provide personalized dating recommendations and improve your experience. You can opt out at any time.',
      NSLocationWhenInUseUsageDescription: 'This app uses your location to show you potential matches nearby and help you connect with people in your area.',
      NSMicrophoneUsageDescription: 'This app uses your microphone to record voice messages for relationship advice and profile enhancement.',
      NSContactsUsageDescription: 'This app accesses your contacts to help you connect with friends who are also using the app and to suggest potential matches from your network.',
      NSCalendarsUsageDescription: 'This app accesses your calendar to help schedule dates and relationship activities, and to send reminders for important relationship milestones.',
      NSRemindersUsageDescription: 'This app creates reminders for dating activities, follow-ups with matches, and relationship goals to help you stay organized in your dating journey.',
      NSHealthShareUsageDescription: 'This app accesses your health data to provide personalized wellness tips and activity suggestions that can enhance your dating life and overall well-being.',
      NSHealthUpdateUsageDescription: 'This app updates your health data with relationship wellness metrics and activity tracking related to your dating experiences.',
      NSMotionUsageDescription: 'This app uses motion data to track your activity levels and suggest active date ideas based on your fitness preferences.',
      NSSiriUsageDescription: 'This app integrates with Siri to help you quickly access dating features, send messages to matches, and get relationship advice through voice commands.',
      NSSpeechRecognitionUsageDescription: 'This app uses speech recognition to help you practice conversation starters, analyze your communication patterns, and provide voice-to-text features for messaging.',
      NSHomeKitUsageDescription: 'This app integrates with HomeKit to suggest romantic home date ideas and help you create the perfect ambiance for dates at home.',
      NSBluetoothAlwaysUsageDescription: 'This app uses Bluetooth to detect when you\'re near potential matches at events or social gatherings, enhancing your chances of making meaningful connections.',
      NSBluetoothPeripheralUsageDescription: 'This app uses Bluetooth to share your dating profile with nearby users who are also using the app, facilitating real-world connections.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'This app uses your location to show you potential matches nearby and help you connect with people in your area, even when the app is running in the background.',
      NSAppleMusicUsageDescription: 'This app accesses your Apple Music library to help match you with people who share similar music tastes and to suggest songs for your dates.',
      CFBundleDisplayName: 'Purposely',
      CFBundleName: 'Purposely',
      // iPhone-only configuration (no iPad support)
      UIRequiresFullScreen: true,
      UISupportedInterfaceOrientations: ['UIInterfaceOrientationPortrait'],
      LSRequiresIPhoneOS: true,
      UIStatusBarHidden: false,
      UIViewControllerBasedStatusBarAppearance: true
    }
  }
};

export default config;
