import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useSubscription } from './useSubscription';
import { toast } from '@/hooks/use-toast';

// In-app purchase interface (simplified for demo)
interface InAppPurchase {
  productId: string;
  price: string;
  title: string;
  description: string;
}

interface PlatformPaymentResult {
  success: boolean;
  error?: string;
  transactionId?: string;
}

export const usePlatformPayments = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { createCheckoutSession } = useSubscription();

  // Detect if running on native mobile platform
  const isNativeMobile = () => {
    return Capacitor.isNativePlatform() && (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android');
  };

  // Store product IDs - these would be configured in App Store Connect and Google Play Console
  const getProductIds = () => ({
    weekly: Capacitor.getPlatform() === 'ios' ? 'purposely_dating_weekly' : 'purposely.dating.weekly',
    yearly: Capacitor.getPlatform() === 'ios' ? 'purposely_dating_yearly' : 'purposely.dating.yearly'
  });

  // Handle in-app purchase for mobile - redirects to app store
  const processInAppPurchase = async (plan: 'weekly' | 'yearly', hasTrial?: boolean): Promise<PlatformPaymentResult> => {
    try {
      setIsProcessing(true);
      
      const platform = Capacitor.getPlatform();
      let storeUrl = '';
      
      if (platform === 'ios') {
        // iOS - App Store (replace with your actual App Store ID)
        storeUrl = 'https://apps.apple.com/app/purposely/id123456789';
      } else if (platform === 'android') {
        // Android - Google Play Store (replace with your actual package name)
        storeUrl = 'https://play.google.com/store/apps/details?id=com.purposely.app';
      }
      
      if (storeUrl) {
        window.open(storeUrl, '_blank');
        
        toast({
          title: "Redirecting to Store",
          description: `Opening ${platform === 'ios' ? 'App Store' : 'Google Play'} to complete your subscription...`,
        });
        
        return {
          success: true,
          transactionId: `store_redirect_${Date.now()}`
        };
      } else {
        throw new Error('Unsupported platform for app store redirect');
      }
      
    } catch (error) {
      console.error('App store redirect failed:', error);
      toast({
        title: "Store Redirect Failed",
        description: "Could not open app store. Please try again.",
        variant: "destructive"
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Store redirect failed'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle web Stripe payment
  const processStripePayment = async (plan: 'weekly' | 'yearly', hasTrial?: boolean): Promise<PlatformPaymentResult> => {
    try {
      setIsProcessing(true);
      await createCheckoutSession(plan, hasTrial);
      return { success: true };
    } catch (error) {
      console.error('Stripe payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  // Main payment processing function
  const processPayment = async (plan: 'weekly' | 'yearly', hasTrial?: boolean): Promise<PlatformPaymentResult> => {
    if (isNativeMobile()) {
      toast({
        title: "Mobile Payment",
        description: "Processing via App Store...",
      });
      return await processInAppPurchase(plan, hasTrial);
    } else {
      toast({
        title: "Web Payment", 
        description: "Redirecting to Stripe...",
      });
      return await processStripePayment(plan, hasTrial);
    }
  };

  // Get platform-specific price display
  const getPlatformPrices = () => {
    if (isNativeMobile()) {
      // In a real app, these would come from the store
      return {
        weekly: '$3.99',
        yearly: '$49.99'
      };
    } else {
      // Web pricing (same as current)
      return {
        weekly: '$3.99',
        yearly: '$49.99'
      };
    }
  };

  // Get platform-specific payment button text
  const getPaymentButtonText = (plan: 'weekly' | 'yearly', hasTrial?: boolean) => {
    const platform = isNativeMobile() ? 'App Store' : 'Stripe';
    
    if (plan === 'yearly' && hasTrial) {
      return isNativeMobile() ? 'Start Free Trial' : 'Start Free Trial';
    }
    
    return isNativeMobile() 
      ? `Purchase via ${Capacitor.getPlatform() === 'ios' ? 'App Store' : 'Google Play'}`
      : `Continue with ${plan === 'weekly' ? 'Weekly' : 'Yearly'} Plan`;
  };

  return {
    isNativeMobile: isNativeMobile(),
    isProcessing,
    processPayment,
    getPlatformPrices,
    getPaymentButtonText,
    currentPlatform: Capacitor.getPlatform(),
  };
};