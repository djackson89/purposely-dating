import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.derrick.purposley',
  appName: 'Purposely',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://a3b2c442-d1f6-40d1-a4a5-f981d6acd20c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;