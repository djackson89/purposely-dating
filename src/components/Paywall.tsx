import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Heart, Sparkles, Check, X, Smartphone, Globe } from 'lucide-react';
import { HeartIcon } from '@/components/ui/heart-icon';
import { usePlatformPayments } from '@/hooks/usePlatformPayments';
import { useToast } from '@/hooks/use-toast';

interface PaywallProps {
  onPlanSelected: () => void;
  onSkipToFree?: () => void;
  isModal?: boolean;
}

const Paywall: React.FC<PaywallProps> = ({ onPlanSelected, onSkipToFree, isModal = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { 
    isNativeMobile, 
    processPayment, 
    getPaymentButtonText, 
    getPlatformPrices,
    currentPlatform,
    isProcessing 
  } = usePlatformPayments();
  const { toast } = useToast();

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      if (isNativeMobile) {
        // For mobile apps, redirect to app store
        const platform = currentPlatform;
        let storeUrl = '';
        
        if (platform === 'ios') {
          storeUrl = 'https://apps.apple.com/app/purposely/id123456789'; // Replace with actual App Store ID
        } else if (platform === 'android') {
          storeUrl = 'https://play.google.com/store/apps/details?id=com.purposely.app'; // Replace with actual package name
        }
        
        if (storeUrl) {
          window.open(storeUrl, '_blank');
          toast({
            title: "Redirecting to Store",
            description: `Opening ${platform === 'ios' ? 'App Store' : 'Google Play'} to complete your subscription...`,
          });
        }
      } else {
        // For web, use platform payment processing (which will use Stripe)
        const result = await processPayment('yearly', true);
        if (result.success) {
          onPlanSelected();
        } else {
          throw new Error(result.error || 'Payment failed');
        }
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      toast({
        title: "Error",
        description: "Failed to start trial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Unlimited conversation starters",
    "AI-powered text message help",
    "Dating prospects tracker", 
    "Therapy companion tools",
    "Mental health check-ins",
    "Growth journal",
    "Premium AI insights",
    "Priority support"
  ];

  const content = (
    <div className={`${isModal ? 'max-w-lg' : 'max-w-lg'} w-full space-y-6`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-romance rounded-full flex items-center justify-center shadow-glow">
            <HeartIcon className="w-8 h-8 text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-romance bg-clip-text text-transparent">
          {isModal ? 'Unlock Premium Features' : 'Welcome to Purposely Premium'}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Transform your dating and relationship journey with AI-powered tools designed for meaningful connections.
        </p>
      </div>

      {/* Premium Plan Card */}
      <Card className="shadow-romance border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-romance"></div>
        
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Badge variant="secondary" className="bg-gradient-romance text-white border-0 px-4 py-1">
              3-Day Free Trial
            </Badge>
          </div>
          
          <CardTitle className="text-2xl font-bold">Premium</CardTitle>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-4xl font-bold text-primary">$0</span>
              <div className="text-left">
                <div className="text-sm text-muted-foreground">for 3 days</div>
                <div className="text-xs text-muted-foreground">then $49.99/year</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Cancel anytime during trial • Full year subscription after trial
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-center mb-4">Everything you need for dating success:</h4>
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Platform indicator */}
          {isNativeMobile && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-4">
              <Smartphone className="w-4 h-4" />
              <span>
                {currentPlatform === 'ios' ? 'App Store' : 'Google Play'} Purchase
              </span>
            </div>
          )}
          
          {!isNativeMobile && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-4">
              <Globe className="w-4 h-4" />
              <span>Web Checkout</span>
            </div>
          )}

          {/* CTA Button */}
          <Button
            onClick={handleStartTrial}
            disabled={isLoading || isProcessing}
            className="w-full bg-gradient-romance hover:opacity-90 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {(isLoading || isProcessing) ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>
                  {isNativeMobile ? 'Opening Store...' : 'Starting Trial...'}
                </span>
              </div>
            ) : (
              <>
                <HeartIcon className="w-5 h-5 mr-2" size={20} />
                {isNativeMobile 
                  ? `Get Premium via ${currentPlatform === 'ios' ? 'App Store' : 'Google Play'}`
                  : 'Try Premium for $0'
                }
              </>
            )}
          </Button>

          {/* No Thank You Option */}
          {onSkipToFree && (
            <div className="text-center pt-4">
              <button
                onClick={onSkipToFree}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
              >
                No thank you, continue with free version
              </button>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="text-center space-y-2 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              ✓ No commitment • ✓ Cancel anytime • ✓ Secure payment
            </p>
            <p className="text-xs text-muted-foreground">
              Start your 3-day free trial and discover deeper connections
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Text */}
      {!isModal && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return content;
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      {content}
    </div>
  );
};

export default Paywall;