import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles } from 'lucide-react';

interface PaywallProps {
  onPlanSelected: (plan: 'weekly' | 'yearly', hasTrial?: boolean) => void;
}

const Paywall: React.FC<PaywallProps> = ({ onPlanSelected }) => {
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'yearly'>('yearly');
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(true);

  const features = [
    "Unlimited AI-powered relationship insights",
    "Personalized conversation starters",
    "Advanced compatibility analysis", 
    "24/7 relationship coaching",
    "Premium date planning assistance",
    "Exclusive relationship masterclasses"
  ];

  const handleContinue = () => {
    onPlanSelected(selectedPlan, selectedPlan === 'yearly' ? freeTrialEnabled : false);
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Unlock Your Relationship Potential
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get personalized insights, expert guidance, and powerful tools to build the meaningful connection you deserve.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Weekly Plan */}
          <Card 
            className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedPlan === 'weekly' 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-accent/5'
            }`}
            onClick={() => setSelectedPlan('weekly')}
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Weekly Plan</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">$3.99</span>
                <span className="text-muted-foreground">/week</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Perfect for getting started
              </p>
              <div className="space-y-2 text-sm">
                {features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
                <div className="pt-2 text-xs text-muted-foreground">
                  + 3 more premium features
                </div>
              </div>
            </div>
          </Card>

          {/* Yearly Plan */}
          <Card 
            className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg relative overflow-hidden ${
              selectedPlan === 'yearly' 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-accent/5'
            }`}
            onClick={() => setSelectedPlan('yearly')}
          >
            <Badge className="absolute top-4 right-4 bg-gradient-to-r from-primary to-accent">
              <Sparkles className="h-3 w-3 mr-1" />
              Best Value
            </Badge>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Yearly Plan</h3>
              <div className="mb-2">
                <span className="text-3xl font-bold">$49.99</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <div className="text-sm text-primary font-medium mb-4">
                Save 76% • Just $0.96/week
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Complete relationship transformation
              </p>
              <div className="space-y-2 text-sm">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Free Trial Toggle - Only for Yearly */}
        {selectedPlan === 'yearly' && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-primary mb-1">
                  Start with 3-Day Free Trial
                </h4>
                <p className="text-sm text-muted-foreground">
                  Try all premium features risk-free. Cancel anytime during trial.
                </p>
              </div>
              <Switch 
                checked={freeTrialEnabled}
                onCheckedChange={setFreeTrialEnabled}
              />
            </div>
          </Card>
        )}

        {/* CTA Button */}
        <div className="text-center">
          <Button 
            onClick={handleContinue}
            size="lg"
            className="w-full md:w-auto px-12 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            {selectedPlan === 'yearly' && freeTrialEnabled 
              ? 'Start Free Trial' 
              : `Continue with ${selectedPlan === 'weekly' ? 'Weekly' : 'Yearly'} Plan`
            }
          </Button>
          
          <p className="text-xs text-muted-foreground mt-4 max-w-md mx-auto">
            {selectedPlan === 'yearly' && freeTrialEnabled 
              ? 'Your free trial starts today. After 3 days, you\'ll be charged $49.99/year unless you cancel.'
              : 'Secure payment processing. Cancel anytime from your account settings.'
            }
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Trusted by thousands of couples worldwide</p>
          <div className="flex justify-center items-center space-x-6 text-xs text-muted-foreground">
            <div>🔒 Secure & Private</div>
            <div>✨ Cancel Anytime</div>
            <div>💝 30-Day Guarantee</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paywall;