import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Lock, Sparkles } from 'lucide-react';
import { useDevice } from '@/hooks/useDevice';
import { useToast } from '@/hooks/use-toast';

interface LockedCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
}

const LockedCategoryModal: React.FC<LockedCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryName
}) => {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);
  const { isNative } = useDevice();
  const { toast } = useToast();

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleStarHover = (rating: number) => {
    setHoveredRating(rating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const redirectToAppStore = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    let storeUrl = '';

    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      // iOS - App Store
      storeUrl = 'https://apps.apple.com/app/purposely-dating';
    } else if (/android/i.test(userAgent)) {
      // Android - Google Play Store  
      storeUrl = 'https://play.google.com/store/apps/details?id=app.lovable.a3b2c442d1f640d1a4a5f981d6acd20c';
    } else {
      // Web fallback
      toast({
        title: "App Store Not Available",
        description: "Please visit the App Store on your mobile device to leave a review.",
        variant: "default",
      });
      return;
    }

    window.open(storeUrl, '_blank');
  };

  const handleSubmitRating = () => {
    if (selectedRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Mark review as submitted in localStorage
    localStorage.setItem('purposely_review_submitted', 'true');
    localStorage.setItem('purposely_review_rating', selectedRating.toString());
    
    if (selectedRating >= 4) {
      // High rating - show thank you and redirect to app store
      setShowThankYou(true);
    } else {
      // Lower rating - just thank them and close
      toast({
        title: "Thank You!",
        description: "Your feedback helps us improve. The category is now unlocked!",
        variant: "default",
      });
      onClose();
    }
  };

  const handleAppStoreReview = () => {
    redirectToAppStore();
    toast({
      title: "Thank You!",
      description: "The category is now unlocked! Thank you for your review.",
      variant: "default",
    });
    onClose();
  };

  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 1: return "Poor";
      case 2: return "Fair"; 
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "";
    }
  };

  const getCategoryDescription = (category: string): string => {
    switch (category) {
      case "Intimacy & Connection":
        return "Deepen physical and emotional bonds with thoughtful questions";
      case "Communication & Conflict":
        return "Master healthy disagreement and resolution skills";
      case "Customize":
        return "Generate personalized conversation starters with AI";
      default:
        return "Premium conversation starters";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-auto">
        {!showThankYou ? (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-romance rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-xl font-semibold">
                Unlock "{categoryName}"
              </DialogTitle>
              <DialogDescription className="text-center text-muted-foreground">
                {getCategoryDescription(categoryName)}
              </DialogDescription>
            </DialogHeader>

            <Card className="border-primary/20 bg-gradient-soft">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="flex items-center justify-center space-x-2 text-primary">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">Premium Feature</span>
                  <Sparkles className="w-5 h-5" />
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Support Purposely by leaving a review{isNative ? ' in the app store' : ''}! 
                  Your feedback helps us create better relationship tools.
                </p>

                <div className="space-y-3">
                  <p className="text-sm font-medium">How would you rate Purposely?</p>
                  
                  <div className="flex justify-center space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleStarClick(rating)}
                        onMouseEnter={() => handleStarHover(rating)}
                        onMouseLeave={handleStarLeave}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            rating <= (hoveredRating || selectedRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {selectedRating > 0 && (
                    <p className="text-sm text-primary font-medium animate-fade-in">
                      {getRatingText(selectedRating)}
                    </p>
                  )}
                </div>

                <div className="flex flex-col space-y-2 pt-4">
                  <Button
                    onClick={handleSubmitRating}
                    disabled={selectedRating === 0}
                    variant="romance"
                    className="w-full"
                  >
                    Submit Rating
                  </Button>
                  
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                  >
                    Maybe Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-romance rounded-full flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-white fill-white" />
              </div>
              <DialogTitle className="text-xl font-semibold">
                Thank You! 🌟
              </DialogTitle>
              <DialogDescription className="text-center text-muted-foreground">
                We appreciate your {selectedRating}-star rating!
              </DialogDescription>
            </DialogHeader>

            <Card className="border-primary/20 bg-gradient-soft">
              <CardContent className="pt-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Since you love Purposely, would you mind sharing your experience 
                  {isNative ? ' in the app store' : ''}? It really helps other couples find us!
                </p>

                <div className="flex flex-col space-y-2">
                  {isNative && (
                    <Button
                      onClick={handleAppStoreReview}
                      variant="romance"
                      className="w-full"
                    >
                      Write a Review
                    </Button>
                  )}
                  
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full"
                  >
                    {isNative ? "Not Now" : "Continue"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LockedCategoryModal;