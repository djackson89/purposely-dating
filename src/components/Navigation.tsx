import React from 'react';
import { Home, MessageCircleHeart, Calendar, HeartHandshake, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  activeModule: 'home' | 'flirtfuel' | 'concierge' | 'therapy' | 'profile';
  onModuleChange: (module: 'home' | 'flirtfuel' | 'concierge' | 'therapy' | 'profile') => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeModule, onModuleChange }) => {
  const navItems = [
    {
      id: 'home' as const,
      icon: Home,
      color: 'text-blue-500'
    },
    {
      id: 'flirtfuel' as const,
      icon: MessageCircleHeart,
      color: 'text-rose-500'
    },
    {
      id: 'concierge' as const,
      icon: Calendar,
      color: 'text-coral-500'
    },
    {
      id: 'therapy' as const,
      icon: HeartHandshake,
      color: 'text-amber-500'
    },
    {
      id: 'profile' as const,
      icon: User,
      color: 'text-purple-500'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border shadow-soft z-50 safe-area-pb">
      <div className="flex justify-around items-center py-2 px-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={cn(
                "flex items-center justify-center min-h-[60px] min-w-[60px]",
                "p-3 rounded-full transition-all duration-300",
                "hover:bg-primary/5 hover:scale-110 active:scale-95",
                "touch-manipulation tap-highlight-transparent",
                isActive && "bg-primary/10 shadow-soft"
              )}
            >
              <div className={cn(
                "p-2 rounded-full transition-all duration-300",
                isActive ? "bg-gradient-romance shadow-glow" : "bg-muted"
              )}>
                <IconComponent 
                  className={cn(
                    "w-6 h-6 transition-all duration-300",
                    isActive ? "text-white animate-heart-pulse" : "text-muted-foreground"
                  )}
                />
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;