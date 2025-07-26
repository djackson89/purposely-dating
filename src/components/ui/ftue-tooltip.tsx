import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FTUETooltipProps {
  id: string;
  title: string;
  description: string;
  className?: string;
}

export const FTUETooltip: React.FC<FTUETooltipProps> = ({
  id,
  title,
  description,
  className = ""
}) => {
  const [hasSeenTooltip, setHasSeenTooltip] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Check if user has seen this tooltip before
    const seenTooltips = JSON.parse(localStorage.getItem('seenFTUETooltips') || '[]');
    const hasSeen = seenTooltips.includes(id);
    setHasSeenTooltip(hasSeen);
    
    // Show tooltip automatically for first-time users after a short delay
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [id]);

  const markAsSeen = () => {
    const seenTooltips = JSON.parse(localStorage.getItem('seenFTUETooltips') || '[]');
    if (!seenTooltips.includes(id)) {
      seenTooltips.push(id);
      localStorage.setItem('seenFTUETooltips', JSON.stringify(seenTooltips));
    }
    setHasSeenTooltip(true);
    setShowTooltip(false);
  };

  const handleOpenTooltip = () => {
    setShowTooltip(true);
  };

  if (showTooltip && !hasSeenTooltip) {
    return (
      <Card className={`shadow-romance border-primary/20 mb-4 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-romance rounded-full flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-primary">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
              <div className="flex justify-end">
                <Button 
                  variant="soft" 
                  size="sm" 
                  onClick={markAsSeen}
                  className="text-xs"
                >
                  Got it! ✨
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={markAsSeen}
              className="flex-shrink-0 h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show help icon for users who have seen it before
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenTooltip}
            className={`h-6 w-6 p-0 text-muted-foreground hover:text-primary ${className}`}
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-medium mb-1">{title}</p>
            <p className="text-xs">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};