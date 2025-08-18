import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  payment_plan?: 'single' | 'split';
  remaining_payments?: number;
}

// Simple module-level cache to avoid duplicate calls across components
let subscriptionCache: SubscriptionData | null = null;
let subscriptionCacheAt = 0;
let subscriptionInFlight: Promise<SubscriptionData | null> | null = null;

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({ subscribed: false });
  const [loading, setLoading] = useState(true);

  const checkSubscription = async (force = false) => {
    if (!user) {
      setSubscription({ subscribed: false });
      setLoading(false);
      return;
    }

    // Check for admin email first
    if (user.email === 'thepurposelyapp@gmail.com') {
      setSubscription({ 
        subscribed: true, 
        subscription_tier: 'Premium',
        subscription_end: '2025-12-31T23:59:59.000Z',
        payment_plan: 'single',
      });
      setLoading(false);
      return;
    }

    const now = Date.now();
    if (!force && subscriptionCache && now - subscriptionCacheAt < 60_000) {
      setSubscription(subscriptionCache);
      setLoading(false);
      return;
    }

    if (subscriptionInFlight) {
      setLoading(true);
      try {
        const result = await subscriptionInFlight;
        if (result) setSubscription(result);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    subscriptionInFlight = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        if (error) {
          console.warn('check-subscription error:', error);
          return null;
        }
        return data as SubscriptionData;
      } catch (e) {
        console.warn('Subscription check failed:', e);
        return null;
      }
    })();

    try {
      const result = await subscriptionInFlight;
      if (result) {
        subscriptionCache = result;
        subscriptionCacheAt = Date.now();
        setSubscription(result);
      }
    } finally {
      subscriptionInFlight = null;
      setLoading(false);
    }
  };

  const createCheckoutSession = async (plan: 'single' | 'split') => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to purchase",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { plan }
      });

      if (error) {
        console.error('Error creating payment session:', error);
        toast({
          title: "Payment setup failed",
          description: "Please try again later",
          variant: "destructive"
        });
        return;
      }

      // Open Stripe checkout in a new tab
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Payment session creation failed:', error);
      toast({
        title: "Payment failed",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };


  useEffect(() => {
    checkSubscription();
  }, [user]);

  return {
    subscription,
    loading,
    checkSubscription,
    createCheckoutSession,
  };
};