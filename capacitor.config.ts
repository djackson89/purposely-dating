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
      NSFaceIDUsageDescription: 'Purposely uses Face ID for secure and convenient authentication to protect your privacy and personal information.'
    }
  }
};

export default config;