import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AboutDialogProps {
  className?: string;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="soft"
        className={`w-full justify-start ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <Info className="w-4 h-4 mr-2" />
        About & Support
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-primary text-center">About Purposely 💕</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 text-sm leading-relaxed">
              <p className="text-muted-foreground">
                Welcome to your journey of intentional singleness and meaningful connections.
              </p>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-primary">How Purposely Enhances Your Singleness Journey:</h3>
                
                <div className="space-y-2">
                  <h4 className="font-medium">🤖 TextGenie - Your AI Conversation Coach</h4>
                  <p className="text-muted-foreground pl-4">
                    Upload screenshots of conversations and get personalized advice on how to respond authentically. 
                    Practice meaningful dialogue with AI that understands your personality and communication style.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">💝 FlirtFuel - Authentic Connection Tools</h4>
                  <p className="text-muted-foreground pl-4">
                    Access curated conversation starters that go beyond small talk. Build genuine connections 
                    through thoughtful questions designed to reveal compatibility and shared values.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">🧠 Therapy Companion - Self-Discovery & Growth</h4>
                  <p className="text-muted-foreground pl-4">
                    Reflect on your emotional journey with guided prompts, track your mental wellness, 
                    and gain insights into your relationship patterns. Build emotional intelligence while single.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">🗓️ Date Concierge - Intentional Dating Support</h4>
                  <p className="text-muted-foreground pl-4">
                    Organize your dating prospects thoughtfully, get personalized date ideas that align with your values, 
                    and make intentional choices about who deserves your time and energy.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-soft p-4 rounded-lg border border-primary/20 space-y-2">
                <h3 className="font-semibold text-primary">Your Singleness is Purposeful</h3>
                <p className="text-muted-foreground text-xs">
                  Being single isn't about waiting for someone else to complete you. It's about becoming the most 
                  authentic version of yourself, building meaningful connections, and choosing relationships that 
                  truly enhance your life. Purposely is here to support you in this intentional journey.
                </p>
              </div>

              <div className="pt-4 space-y-2">
                <h3 className="font-semibold text-primary">Need Support?</h3>
                <p className="text-muted-foreground">
                  Have questions, feedback, or need assistance? We're here to help!
                </p>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Contact us:</span>{' '}
                    <a 
                      href="mailto:info@betterconvos.com" 
                      className="text-primary hover:underline"
                    >
                      info@betterconvos.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};