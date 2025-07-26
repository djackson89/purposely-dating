import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({ subscribed: false });
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) {
      setSubscription({ subscribed: false });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        toast({
          title: "Error checking subscription",
          description: "Please try again later",
          variant: "destructive"
        });
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Subscription check failed:', error);
      toast({
        title: "Subscription check failed",
        description: "Please check your connection and try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (plan: 'weekly' | 'yearly', hasTrial?: boolean) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to subscribe",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan, hasTrial }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
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
      console.error('Checkout session creation failed:', error);
      toast({
        title: "Payment failed",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to manage your subscription",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        console.error('Error opening customer portal:', error);
        toast({
          title: "Portal access failed",
          description: "Please try again later",
          variant: "destructive"
        });
        return;
      }

      // Open customer portal in a new tab
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Customer portal failed:', error);
      toast({
        title: "Portal failed",
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
    openCustomerPortal,
  };
};