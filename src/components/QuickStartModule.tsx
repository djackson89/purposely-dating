import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageCircle, 
  Bot, 
  Wand2, 
  Heart, 
  Calendar
} from 'lucide-react';

interface QuickStartProps {
  onNavigateToModule: (module: string) => void;
}

const quickStartItems = [
  {
    id: 'conversation-starters',
    category: 'Communication',
    title: 'Ditch the Small Talk',
    subtitle: 'Deep conversations',
    icon: MessageCircle,
    gradient: 'from-burgundy to-primary',
    action: 'flirtfuel'
  },
  {
    id: 'ai-practice',
    category: 'Training',
    title: 'Practice Makes Perfect',
    subtitle: 'AI roleplay sessions',
    icon: Bot,
    gradient: 'from-burgundy/80 to-accent',
    action: 'flirtfuel'
  },
  {
    id: 'text-genie',
    category: 'Messaging',
    title: 'Sharpen Your Clap-backs!',
    subtitle: 'Perfect responses',
    icon: Wand2,
    gradient: 'from-burgundy/70 to-primary-glow',
    action: 'flirtfuel'
  },
  {
    id: 'therapy-companion',
    category: 'Wellness',
    title: 'Find Your Inner Peace',
    subtitle: 'Relationship guidance',
    icon: Heart,
    gradient: 'from-burgundy/60 to-secondary',
    action: 'therapy'
  },
  {
    id: 'date-planner',
    category: 'Planning',
    title: 'Plan Your Perfect Date',
    subtitle: 'Personalized ideas',
    icon: Calendar,
    gradient: 'from-burgundy/50 to-accent/80',
    action: 'concierge'
  }
];

const QuickStartModule: React.FC<QuickStartProps> = ({ onNavigateToModule }) => {
  const handleCardClick = (item: typeof quickStartItems[0]) => {
    // Store the specific sub-section for modules that have multiple features
    if (item.action === 'flirtfuel') {
      switch (item.id) {
        case 'conversation-starters':
          localStorage.setItem('activePracticeSection', 'starters');
          break;
        case 'ai-practice':
          localStorage.setItem('activePracticeSection', 'practice');
          break;
        case 'text-genie':
          localStorage.setItem('activePracticeSection', 'genie');
          break;
      }
    }
    
    onNavigateToModule(item.action);
  };

  return (
    <div className="w-full px-4 mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Quick Start</h2>
        <p className="text-muted-foreground">Choose your journey</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {quickStartItems.map((item) => (
          <Card 
            key={item.id}
            className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-romance border border-border/50 overflow-hidden h-48"
            onClick={() => handleCardClick(item)}
          >
            <CardContent className="p-0 h-full relative">
              <div className={`h-full bg-gradient-to-br ${item.gradient} p-4 flex flex-col justify-between text-white relative overflow-hidden`}>
                {/* Background decorative elements */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-white/30 -translate-y-6 translate-x-6"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 rounded-full bg-white/20 translate-y-4 -translate-x-4"></div>
                  <div className="absolute top-1/2 right-1/4 w-8 h-8 rounded-full bg-white/15"></div>
                </div>
                
                {/* Header with category */}
                <div className="relative">
                  <div className="bg-white/20 rounded-full px-3 py-1 w-fit mb-3">
                    <span className="text-xs font-medium text-white">{item.category}</span>
                  </div>
                </div>
                
                {/* Icon container */}
                <div className="relative flex-1 flex items-center justify-center">
                  <div className="bg-white/20 rounded-full p-4">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                {/* Content */}
                <div className="relative">
                  <h3 className="font-bold text-sm leading-tight mb-1">{item.title}</h3>
                  <p className="text-xs text-white/80 leading-tight">{item.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuickStartModule;