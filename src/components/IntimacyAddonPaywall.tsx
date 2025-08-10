import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Flame } from 'lucide-react';

interface IntimacyAddonPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

const features = [
  'Adult‑only conversation starters',
  'Consent‑first scenarios and dares',
  'Spicy A–D choices and roleplay prompts',
  'New packs and seasonal drops',
  'Priority support',
];

const IntimacyAddonPaywall: React.FC<IntimacyAddonPaywallProps> = ({ isOpen, onClose, onUnlock }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg mx-auto p-0 overflow-hidden">
        {/* Soft gradient background */}
        <div className="absolute inset-0 bg-gradient-romance opacity-5"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-romance"></div>

        <div className="relative p-6 space-y-6">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-romance rounded-full flex items-center justify-center shadow-glow">
              <Flame className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
              Unlock 18+ Intimacy Add‑on
            </DialogTitle>
            <DialogDescription className="text-lg text-muted-foreground">
              Premium member exclusive — add spicy, adult‑only topics to your toolkit.
            </DialogDescription>
          </DialogHeader>

          <Card className="shadow-romance border-primary/20 relative overflow-hidden bg-gradient-soft">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-romance" />
            <CardContent className="pt-6 space-y-5">
              {/* Pricing */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold text-primary">$2.99</span>
                  <div className="text-left leading-tight">
                    <div className="text-sm text-muted-foreground">per week</div>
                    <div className="text-xs text-muted-foreground">No trial • Cancel anytime</div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 gap-2">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={onUnlock}
                  className="w-full bg-gradient-romance hover:opacity-90 text-white font-semibold py-3 text-lg shadow-lg transition-all duration-300"
                >
                  Unlock for $2.99/week
                </Button>
                <Button variant="ghost" size="sm" className="w-full" onClick={onClose}>
                  Maybe Later
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="text-center space-y-1 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">✓ Secure payment • ✓ Cancel anytime</p>
                <p className="text-xs text-muted-foreground opacity-75">Add‑on billed separately from Premium</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IntimacyAddonPaywall;
