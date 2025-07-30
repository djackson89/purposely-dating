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
      NSPhotoLibraryUsageDescription: 'This app accesses your photo library to let you select profile pictures, upload conversation screenshots for AI relationship advice, and remove image backgrounds to enhance your dating profile photos.',
      NSCameraUsageDescription: 'This app uses your camera to take new profile pictures and capture conversation screenshots that you can analyze with our AI relationship coach.',
      NSPhotoLibraryAddUsageDescription: 'This app saves processed images (such as background-removed photos) to your photo library so you can use them in your dating profiles.',
      NSFaceIDUsageDescription: 'This app uses Face ID for secure authentication to protect your privacy and personal information.',
      NSUserTrackingUsageDescription: 'This app uses tracking data to provide personalized dating recommendations and improve your experience. You can opt out at any time.',
      NSMicrophoneUsageDescription: 'This app uses your microphone to record voice messages for relationship advice and profile enhancement.',
      CFBundleDisplayName: 'Purposely',
      CFBundleName: 'Purposely'
    }
  }
};

export default config;