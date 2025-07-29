import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageCircle, 
  Bot, 
  Wand2, 
  Heart, 
  Calendar,
  ArrowRight
} from 'lucide-react';

interface QuickStartProps {
  onNavigateToModule: (module: string) => void;
}

const quickStartItems = [
  {
    id: 'conversation-starters',
    title: 'Ditch the Small Talk',
    description: 'Deep conversation starters',
    icon: MessageCircle,
    gradient: 'from-burgundy to-primary',
    action: 'flirtfuel' // maps to the FlirtFuel module with conversation starters
  },
  {
    id: 'ai-practice',
    title: 'Practice Makes Perfect',
    description: 'AI practice conversations',
    icon: Bot,
    gradient: 'from-burgundy/80 to-accent',
    action: 'flirtfuel' // maps to the FlirtFuel module with AI practice
  },
  {
    id: 'text-genie',
    title: 'Sharpen Your Clap-backs!',
    description: 'Perfect text responses',
    icon: Wand2,
    gradient: 'from-burgundy/70 to-primary-glow',
    action: 'flirtfuel' // maps to the FlirtFuel module with text genie
  },
  {
    id: 'therapy-companion',
    title: 'Find Your Inner Peace',
    description: 'Relationship guidance',
    icon: Heart,
    gradient: 'from-burgundy/60 to-secondary',
    action: 'therapy'
  },
  {
    id: 'date-planner',
    title: 'Plan Your Perfect Date',
    description: 'Personalized date ideas',
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Quick Start</h2>
        <ArrowRight className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {quickStartItems.map((item) => (
            <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-4/5 md:basis-1/2 lg:basis-1/3">
              <Card 
                className="h-32 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-romance border-0 overflow-hidden"
                onClick={() => handleCardClick(item)}
              >
                <CardContent className="p-0 h-full relative">
                  <div className={`h-full bg-gradient-to-br ${item.gradient} p-4 flex flex-col justify-between text-white relative overflow-hidden`}>
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/20 -translate-y-8 translate-x-8"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/15 translate-y-6 -translate-x-6"></div>
                    </div>
                    
                    {/* Icon */}
                    <div className="relative">
                      <item.icon className="w-8 h-8 text-white/90" />
                    </div>
                    
                    {/* Content */}
                    <div className="relative">
                      <h3 className="font-bold text-sm leading-tight mb-1">{item.title}</h3>
                      <p className="text-xs text-white/80 leading-tight">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 border-burgundy/20 bg-white/90 hover:bg-white text-burgundy hover:text-burgundy" />
        <CarouselNext className="hidden md:flex -right-4 border-burgundy/20 bg-white/90 hover:bg-white text-burgundy hover:text-burgundy" />
      </Carousel>
    </div>
  );
};

export default QuickStartModule;