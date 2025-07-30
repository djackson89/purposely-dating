import React, { useState, useEffect } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel";
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
    gradient: 'from-pink-500 via-rose-500 to-burgundy',
    action: 'flirtfuel'
  },
  {
    id: 'ai-practice',
    category: 'Training',
    title: 'Practice Makes Perfect',
    subtitle: 'AI roleplay sessions',
    icon: Bot,
    gradient: 'from-purple-500 via-indigo-500 to-blue-600',
    action: 'flirtfuel'
  },
  {
    id: 'text-genie',
    category: 'Messaging',
    title: 'Sharpen Your Clap-backs!',
    subtitle: 'Perfect responses',
    icon: Wand2,
    gradient: 'from-orange-500 via-red-500 to-pink-600',
    action: 'flirtfuel'
  },
  {
    id: 'therapy-companion',
    category: 'Wellness',
    title: 'Find Your Inner Peace',
    subtitle: 'Relationship guidance',
    icon: Heart,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    action: 'therapy'
  },
  {
    id: 'date-planner',
    category: 'Planning',
    title: 'Plan Your Perfect Date',
    subtitle: 'Personalized ideas',
    icon: Calendar,
    gradient: 'from-violet-500 via-purple-500 to-indigo-600',
    action: 'concierge'
  }
];

const QuickStartModule: React.FC<QuickStartProps> = ({ onNavigateToModule }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!api) {
      return;
    }

    const snapList = api.scrollSnapList();
    // For mobile, calculate visible pages based on items per view
    const itemsPerView = isMobile ? 2 : Math.min(4, quickStartItems.length);
    const totalPages = Math.ceil(quickStartItems.length / itemsPerView);
    
    setCount(isMobile ? totalPages : snapList.length);
    setCurrent(Math.floor(api.selectedScrollSnap() / (isMobile ? itemsPerView : 1)) + 1);

    api.on("select", () => {
      setCurrent(Math.floor(api.selectedScrollSnap() / (isMobile ? itemsPerView : 1)) + 1);
    });
  }, [api, isMobile]);

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
    <div className="w-full px-4 mb-20">
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="text-2xl font-bold text-foreground">Quick Start</h2>
        <p className="text-muted-foreground">Choose your journey</p>
      </div>
      
      {/* Progress indicator */}
      <div className="mb-6 flex justify-center">
        <div className="flex gap-1">
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              className={`h-0.5 w-8 rounded-full transition-all duration-300 ${
                index === current - 1
                  ? 'bg-primary' 
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>
      
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {quickStartItems.map((item) => (
            <CarouselItem key={item.id} className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4">
              <Card 
                className="cursor-pointer transition-all duration-300 hover:scale-105 border-0 overflow-hidden h-48 sm:h-44 shadow-2xl hover:shadow-3xl"
                onClick={() => handleCardClick(item)}
              >
                <CardContent className="p-0 h-full relative">
                  <div className={`h-full bg-gradient-to-br ${item.gradient} p-4 sm:p-6 flex flex-col justify-between text-white relative overflow-hidden shadow-inner`}>
                    {/* Enhanced background decorative elements */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/40 -translate-y-8 translate-x-8 blur-sm"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/30 translate-y-6 -translate-x-6 blur-sm"></div>
                      <div className="absolute top-1/3 right-1/3 w-12 h-12 rounded-full bg-white/25 blur-sm"></div>
                      <div className="absolute bottom-1/3 right-1/2 w-8 h-8 rounded-full bg-white/20 blur-sm"></div>
                    </div>
                    
                    {/* Header with category */}
                    <div className="relative">
                      <div className="bg-white/25 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-1.5 w-fit mb-2 sm:mb-4 shadow-lg">
                        <span className="text-xs font-semibold text-white">{item.category}</span>
                      </div>
                    </div>
                    
                    {/* Icon container */}
                    <div className="relative flex-1 flex items-center justify-center">
                      <div className="bg-white/25 backdrop-blur-sm rounded-full p-3 sm:p-5 shadow-xl">
                        <item.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-lg" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative">
                      <h3 className="font-bold text-sm sm:text-base leading-tight mb-1 sm:mb-2 drop-shadow-lg">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-white/90 leading-tight drop-shadow-md">{item.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex -left-2 border-white/20 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-800 shadow-lg" />
        <CarouselNext className="hidden sm:flex -right-2 border-white/20 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-800 shadow-lg" />
      </Carousel>
    </div>
  );
};

export default QuickStartModule;