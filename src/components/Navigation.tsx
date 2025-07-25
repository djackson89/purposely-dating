import React from 'react';
import { Heart, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  activeModule: 'flirtfuel' | 'concierge' | 'therapy';
  onModuleChange: (module: 'flirtfuel' | 'concierge' | 'therapy') => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeModule, onModuleChange }) => {
  const navItems = [
    {
      id: 'flirtfuel' as const,
      icon: Heart,
      label: 'FlirtFuel',
      color: 'text-rose-500'
    },
    {
      id: 'concierge' as const,
      icon: Calendar,
      label: 'Date Concierge',
      color: 'text-coral-500'
    },
    {
      id: 'therapy' as const,
      icon: Sparkles,
      label: 'Therapy Companion',
      color: 'text-amber-500'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-soft z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={cn(
                "flex flex-col items-center py-2 px-4 rounded-lg transition-all duration-300",
                "hover:bg-primary/5 hover:scale-105",
                isActive && "bg-primary/10 shadow-soft"
              )}
            >
              <div className={cn(
                "p-2 rounded-full transition-all duration-300",
                isActive ? "bg-gradient-romance shadow-glow" : "bg-muted"
              )}>
                <IconComponent 
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive ? "text-white animate-heart-pulse" : "text-muted-foreground"
                  )}
                />
              </div>
              <span className={cn(
                "text-xs mt-1 transition-all duration-300 font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;