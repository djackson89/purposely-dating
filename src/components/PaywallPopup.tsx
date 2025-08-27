import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Heart, Sparkles, Check, X, Zap, Star } from 'lucide-react';
import { HeartIcon } from '@/components/ui/heart-icon';

interface PaywallPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  trigger: 'view_limit' | 'ask_purposely' | 'next_question';
}

const PaywallPopup: React.FC<PaywallPopupProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  trigger
}) => {
  const getTriggerContent = () => {
    switch (trigger) {
      case 'view_limit':
        return {
          title: "You've Seen the Best Part! 😍",
          subtitle: "Time to unlock the full experience",
          description: "You've explored 10 conversation starters. Ready for unlimited access to deeper connections?",
          buttonText: "Unlock All Features",
          icon: <Star className="w-8 h-8 text-white" />
        };
      case 'ask_purposely':
        return {
          title: "Ask Purposely Premium Feature 🤖",
          subtitle: "Get personalized AI guidance",
          description: "Our AI relationship coach is ready to help you navigate any dating situation. Upgrade to get instant answers!",
          buttonText: "Get AI Coaching",
          icon: <Zap className="w-8 h-8 text-white" />
        };
      case 'next_question':
        return {
          title: "More Questions Await! 💫",
          subtitle: "Keep the conversation flowing",
          description: "You've sampled our conversation starters. Unlock hundreds more to keep building deeper connections!",
          buttonText: "Get More Questions",
          icon: <Sparkles className="w-8 h-8 text-white" />
        };
      default:
        return {
          title: "Unlock Premium Features",
          subtitle: "Experience the full power of Purposely",
          description: "Ready to take your dating life to the next level?",
          buttonText: "Upgrade Now",
          icon: <Crown className="w-8 h-8 text-white" />
        };
    }
  };

  const features = [
    "Unlimited conversation starters",
    "AI-powered personalized coaching",
    "Advanced relationship tools",
    "Red Flag Detector",
    "Custom conversation generator",
    "Priority support"
  ];

  const content = getTriggerContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg mx-auto p-0 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-romance opacity-5 animate-pulse"></div>
        
        {/* Gradient Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-romance"></div>
        
        <div className="relative p-6 space-y-6">
          {/* Header */}
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-romance rounded-full flex items-center justify-center shadow-glow animate-bounce">
              {content.icon}
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
              {content.title}
            </DialogTitle>
            <DialogDescription className="text-lg font-medium text-muted-foreground">
              {content.subtitle}
            </DialogDescription>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content.description}
            </p>
          </DialogHeader>

          {/* Premium Highlight Card */}
          <Card className="shadow-romance border-primary/20 relative overflow-hidden bg-gradient-soft">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-romance"></div>
            
            <CardContent className="pt-6 space-y-4">
              {/* Pricing Display */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Badge variant="secondary" className="bg-gradient-romance text-white border-0 px-3 py-1">
                    One-Time Payment
                  </Badge>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-3xl font-bold text-primary">$997</span>
                  <div className="text-left">
                    <div className="text-sm text-muted-foreground">one-time</div>
                    <div className="text-xs text-muted-foreground">lifetime access</div>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 gap-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={onUpgrade}
                  className="w-full bg-gradient-romance hover:opacity-90 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <HeartIcon className="w-5 h-5 mr-2" size={20} />
                  {content.buttonText}
                </Button>
                
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Maybe Later
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="text-center space-y-1 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  ✓ Lifetime access • ✓ No recurring fees • ✓ Secure payment
                </p>
                <p className="text-xs text-muted-foreground opacity-75">
                  Unlock all features with one payment
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaywallPopup;