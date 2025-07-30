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
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Purposely may use your location to help you find compatible matches in your area and enhance your dating experience.',
      NSLocationAlwaysUsageDescription: 'Purposely may use your location to help you find compatible matches in your area and enhance your dating experience.',
      NSMicrophoneUsageDescription: 'Purposely may use your microphone for voice messages and audio features within the app.',
      NSContactsUsageDescription: 'Purposely may access your contacts to help you find friends who are also using the app.',
      NSCalendarsUsageDescription: 'Purposely may access your calendar to help schedule dates and relationship activities.',
      NSRemindersUsageDescription: 'Purposely may access your reminders to help you stay on top of important relationship milestones and dates.',
      NSMotionUsageDescription: 'Purposely may use motion data to enhance user experience and provide gesture-based interactions.',
      NSBluetoothPeripheralUsageDescription: 'Purposely may use Bluetooth to connect with compatible devices for enhanced app functionality.',
      NSBluetoothAlwaysUsageDescription: 'Purposely may use Bluetooth to connect with compatible devices for enhanced app functionality.',
      NSAppleMusicUsageDescription: 'Purposely may access your music library to help you share music preferences and discover compatibility with potential matches.',
      NSHealthShareUsageDescription: 'Purposely may access your health data to provide wellness-focused dating insights and compatibility matching.',
      NSHealthUpdateUsageDescription: 'Purposely may update your health data to track relationship wellness and personal growth metrics.',
      NSSpeechRecognitionUsageDescription: 'Purposely may use speech recognition to improve voice message features and accessibility.',
      NSVideoSubscriberAccountUsageDescription: 'Purposely may access your TV provider information to suggest shared entertainment preferences with potential matches.',
      NSHomeKitUsageDescription: 'Purposely may access HomeKit to suggest compatibility based on home and lifestyle preferences.',
      NSSiriUsageDescription: 'Purposely integrates with Siri to provide voice-activated relationship assistance and reminders.',
      NSLocalNetworkUsageDescription: 'Purposely may access local network to provide enhanced connectivity features and improve app performance.',
      NSNearbyInteractionUsageDescription: 'Purposely may use nearby interaction to help you connect with other users in your vicinity.',
      NSFileProviderDomainUsageDescription: 'Purposely may access file providers to help you share documents and media within the app.',
      NSDesktopFolderUsageDescription: 'Purposely may access your desktop folder to import photos and documents for your profile.',
      NSDocumentsFolderUsageDescription: 'Purposely may access your documents folder to import files for your dating profile.',
      NSDownloadsFolderUsageDescription: 'Purposely may access your downloads folder to import media and documents for sharing.',
      NSNetworkVolumesUsageDescription: 'Purposely may access network volumes to sync data across your devices.',
      NSRemovableVolumesUsageDescription: 'Purposely may access removable volumes to import photos and media for your profile.'
    }
  }
};

export default config;