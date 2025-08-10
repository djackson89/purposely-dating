import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from '@/hooks/use-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkSubscription } = useSubscription();
  const [isVerifying, setIsVerifying] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Verify payment and refresh subscription status
    const verifyPayment = async () => {
      if (!sessionId) {
        toast({
          title: "Invalid payment session",
          description: "No session ID found in URL",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      try {
        // Force refresh subscription status
        await checkSubscription(true);
        
        toast({
          title: "Payment successful! 🎉",
          description: "Welcome to Purposely Premium! Your subscription is now active.",
        });
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast({
          title: "Payment completed",
          description: "Your payment was processed. Subscription details will update shortly.",
        });
      } finally {
        setIsVerifying(false);
        // Briefly show success, then continue
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1800);
      }
    };

    verifyPayment();
  }, [sessionId, checkSubscription, navigate]);

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-8 shadow-elegant border border-white/10">
          {isVerifying ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Verifying Payment...
              </h1>
              <p className="text-muted-foreground">
                Please wait while we confirm your subscription.
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse"></div>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Welcome to Premium! 🎉
              </h1>
              
              <p className="text-muted-foreground mb-8">
                Your payment was successful and your premium subscription is now active. 
                You now have access to all premium features!
              </p>
              
              <div className="space-y-4">
                <div className="bg-primary/10 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-foreground mb-2">What's included:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✨ Unlimited conversation starters</li>
                    <li>🎯 Advanced dating strategies</li>
                    <li>💝 Personalized relationship insights</li>
                    <li>🧠 Mental health companion</li>
                    <li>📱 Priority support</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={handleContinue}
                  className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-300"
                  size="lg"
                >
                  Continue to App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              {sessionId && (
                <p className="text-xs text-muted-foreground mt-4">
                  Session ID: {sessionId.slice(0, 20)}...
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;