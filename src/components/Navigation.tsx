import React from 'react';
import { Home, Heart, Calendar, Sparkles, User } from 'lucide-react';
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
      label: 'Home',
      shortLabel: 'Home',
      color: 'text-blue-500'
    },
    {
      id: 'flirtfuel' as const,
      icon: Heart,
      label: 'FlirtFuel',
      shortLabel: 'Flirt',
      color: 'text-rose-500'
    },
    {
      id: 'concierge' as const,
      icon: Calendar,
      label: 'Date Concierge',
      shortLabel: 'Dates',
      color: 'text-coral-500'
    },
    {
      id: 'therapy' as const,
      icon: Sparkles,
      label: 'Therapy Companion',
      shortLabel: 'Therapy',
      color: 'text-amber-500'
    },
    {
      id: 'profile' as const,
      icon: User,
      label: 'Profile',
      shortLabel: 'Profile',
      color: 'text-purple-500'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border shadow-soft z-50 safe-area-pb">
      <div className="flex justify-around items-center py-1 px-1 sm:py-2 sm:px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center min-h-[60px] sm:min-h-[70px]",
                "py-1 px-1 sm:py-2 sm:px-2 rounded-lg transition-all duration-300",
                "hover:bg-primary/5 hover:scale-105 active:scale-95",
                "touch-manipulation tap-highlight-transparent",
                isActive && "bg-primary/10 shadow-soft",
                "flex-1 max-w-[20%]" // Ensure equal distribution
              )}
            >
              <div className={cn(
                "p-1.5 sm:p-2 rounded-full transition-all duration-300",
                isActive ? "bg-gradient-romance shadow-glow" : "bg-muted"
              )}>
                <IconComponent 
                  className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300",
                    isActive ? "text-white animate-heart-pulse" : "text-muted-foreground"
                  )}
                />
              </div>
              <span className={cn(
                "text-[10px] sm:text-xs mt-0.5 sm:mt-1 transition-all duration-300 font-medium",
                "leading-tight text-center line-clamp-1",
                isActive ? "text-primary" : "text-muted-foreground",
                "hidden xs:block" // Hide labels on very small screens
              )}>
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
              </span>
              {/* Show just icons on very small screens */}
              <span className={cn(
                "text-[9px] mt-0.5 transition-all duration-300 font-medium",
                "leading-tight text-center",
                isActive ? "text-primary" : "text-muted-foreground",
                "xs:hidden" // Only show on very small screens
              )}>
                {item.shortLabel.charAt(0)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;