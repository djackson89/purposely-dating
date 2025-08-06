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
      CFBundleDisplayName: 'Purposely',
      CFBundleName: 'Purposely',
      // iPad-specific configurations
      UIRequiresFullScreen: false,
      UISupportedInterfaceOrientations: ['UIInterfaceOrientationPortrait', 'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight'],
      'UISupportedInterfaceOrientations~ipad': ['UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown', 'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight'],
      UIStatusBarHidden: false,
      UIViewControllerBasedStatusBarAppearance: true
    }
  }
};

export default config;