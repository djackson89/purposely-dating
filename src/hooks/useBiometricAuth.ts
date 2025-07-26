import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/components/ui/use-toast';

interface BiometricCheckResult {
  available: boolean;
  reason?: string;
  strongBiometricSupported?: boolean;
  biometricSupported?: boolean;
}

interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async (): Promise<BiometricCheckResult> => {
    if (!Capacitor.isNativePlatform()) {
      return { available: false, reason: 'Not supported on web' };
    }

    try {
      // For now, we'll simulate biometric availability check
      // In a real implementation, you'd use @capacitor-community/biometric-auth
      const mockResult = {
        available: true,
        strongBiometricSupported: true,
        biometricSupported: true,
      };
      
      setIsAvailable(mockResult.available);
      setIsSupported(true);
      
      return mockResult;
    } catch (error) {
      console.error('Biometric check failed:', error);
      return { available: false, reason: 'Check failed' };
    }
  };

  const authenticateWithBiometric = async (): Promise<BiometricAuthResult> => {
    if (!isAvailable) {
      return { success: false, error: 'Biometric authentication not available' };
    }

    try {
      // For now, we'll simulate biometric authentication
      // In a real implementation, you'd use the actual biometric plugin
      
      // Simulate authentication prompt
      const userConfirmed = window.confirm('Biometric authentication would be triggered here. Simulate success?');
      
      if (userConfirmed) {
        toast({
          title: "Authentication Successful",
          description: "Biometric authentication completed successfully.",
        });
        return { success: true };
      } else {
        return { success: false, error: 'User cancelled authentication' };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Authentication failed';
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  const enableBiometricAuth = async (): Promise<boolean> => {
    const result = await authenticateWithBiometric();
    if (result.success) {
      localStorage.setItem('biometric_enabled', 'true');
      toast({
        title: "Biometric Auth Enabled",
        description: "You can now use biometric authentication to access the app.",
      });
      return true;
    }
    return false;
  };

  const disableBiometricAuth = () => {
    localStorage.removeItem('biometric_enabled');
    toast({
      title: "Biometric Auth Disabled",
      description: "Biometric authentication has been disabled.",
    });
  };

  const isBiometricEnabled = (): boolean => {
    return localStorage.getItem('biometric_enabled') === 'true';
  };

  // Data security utilities
  const secureStore = (key: string, value: string): void => {
    try {
      // In a real app, you'd use secure storage
      localStorage.setItem(`secure_${key}`, btoa(value)); // Basic encoding
    } catch (error) {
      console.error('Secure store failed:', error);
    }
  };

  const secureRetrieve = (key: string): string | null => {
    try {
      const encoded = localStorage.getItem(`secure_${key}`);
      return encoded ? atob(encoded) : null;
    } catch (error) {
      console.error('Secure retrieve failed:', error);
      return null;
    }
  };

  const secureRemove = (key: string): void => {
    localStorage.removeItem(`secure_${key}`);
  };

  return {
    isSupported,
    isAvailable,
    checkBiometricAvailability,
    authenticateWithBiometric,
    enableBiometricAuth,
    disableBiometricAuth,
    isBiometricEnabled,
    secureStore,
    secureRetrieve,
    secureRemove,
  };
};