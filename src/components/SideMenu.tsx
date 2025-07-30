import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  MessageCircle, 
  Wand2, 
  Target, 
  Users, 
  Calendar, 
  Heart, 
  BookOpen,
  X,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SupportDialog from '@/components/SupportDialog';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToModule?: (module: string) => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, onNavigateToModule }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [showSupportDialog, setShowSupportDialog] = useState(false);

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'conversation-starters', label: 'Conversation Starters', icon: MessageCircle },
    { id: 'text-genie', label: 'Text Genie', icon: Wand2 },
    { id: 'practice-partner', label: 'Practice Partner', icon: Target },
    { id: 'dating-prospects', label: 'Dating Prospects', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'therapy-companion', label: 'Therapy Companion', icon: Heart },
    { id: 'journal', label: 'Journal', icon: BookOpen },
  ];

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleMenuItemClick = (itemId: string) => {
    // Map menu items to modules
    const moduleMap: Record<string, string> = {
      'profile': 'profile',
      'conversation-starters': 'flirtfuel',
      'text-genie': 'flirtfuel',
      'practice-partner': 'flirtfuel',
      'dating-prospects': 'concierge',
      'calendar': 'concierge',
      'therapy-companion': 'therapy',
      'journal': 'therapy',
    };

    const targetModule = moduleMap[itemId];
    if (targetModule && onNavigateToModule) {
      onNavigateToModule(targetModule);
    }
    onClose();
  };

  const handleSupportClick = () => {
    setShowSupportDialog(true);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleOverlayClick}
      />

      {/* Side Menu */}
      <div
        ref={menuRef}
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-background z-50 transform transition-transform duration-300 ease-out shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-romance rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Purposely</h2>
              <p className="text-sm text-muted-foreground">Dating with Purpose</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 py-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item.id)}
                className="w-full flex items-center space-x-4 px-6 py-4 hover:bg-muted/50 transition-colors text-left"
              >
                <IconComponent className="w-6 h-6 text-foreground" />
                <span className="text-lg font-bold text-foreground">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Support Section */}
        <div className="border-t border-border">
          <button
            onClick={handleSupportClick}
            className="w-full flex items-center space-x-4 px-6 py-4 hover:bg-muted/50 transition-colors text-left"
          >
            <HelpCircle className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-primary">Support</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Swipe from left edge to open menu
          </p>
        </div>
      </div>

      {/* Support Dialog */}
      <SupportDialog 
        isOpen={showSupportDialog} 
        onClose={() => setShowSupportDialog(false)} 
      />
    </>
  );
};

export default SideMenu;