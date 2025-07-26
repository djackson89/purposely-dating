import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Heart, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReviewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReviewRequestModal: React.FC<ReviewRequestModalProps> = ({ isOpen, onClose }) => {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);
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
    // Detect platform and redirect accordingly
    const userAgent = navigator.userAgent || navigator.vendor;
    let storeUrl = '';

    if (/iPad|iPhone|iPod/.test(userAgent)) {
      // iOS - App Store
      storeUrl = 'https://apps.apple.com/app/purposely/id123456789'; // Replace with actual App Store ID
    } else if (/android/i.test(userAgent)) {
      // Android - Google Play Store  
      storeUrl = 'https://play.google.com/store/apps/details?id=com.purposely.app'; // Replace with actual package name
    } else {
      // Web fallback - could be a web review platform
      storeUrl = 'https://www.trustpilot.com/review/purposely.app'; // Or another review platform
    }

    window.open(storeUrl, '_blank');
  };

  const handleSubmitRating = () => {
    if (selectedRating === 0) {
      toast({
        title: "Please select a rating",
        description: "Let us know what you think with a star rating!",
        variant: "destructive",
      });
      return;
    }

    // Store the rating in localStorage
    localStorage.setItem('purposely_user_rating', selectedRating.toString());
    localStorage.setItem('purposely_review_submitted', 'true');

    if (selectedRating >= 4) {
      // High rating - encourage App Store review
      setShowThankYou(true);
    } else {
      // Lower rating - thank them and close
      toast({
        title: "Thank you for your feedback!",
        description: "We appreciate your input and will work to improve your experience.",
      });
      onClose();
    }
  };

  const handleAppStoreReview = () => {
    redirectToAppStore();
    
    // Mark that they were directed to app store
    localStorage.setItem('purposely_appstore_directed', 'true');
    
    toast({
      title: "Thank you! 💜",
      description: "Your review helps other people discover Purposely!",
    });
    
    onClose();
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return "Poor";
      case 2: return "Fair"; 
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "Rate your experience";
    }
  };

  if (showThankYou) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-primary animate-heart-pulse" />
              <span>Thank you! 💜</span>
            </DialogTitle>
          </DialogHeader>
          
          <Card className="border-primary/20 bg-gradient-soft">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  We're so glad you're loving Purposely! 
                </p>
                <p className="text-sm font-medium">
                  Would you mind sharing your experience with others by leaving a review?
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleAppStoreReview}
                  variant="romance"
                  className="flex-1 gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Write a Review
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Maybe Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-primary animate-heart-pulse" />
            <span>How's Purposely working for you?</span>
          </DialogTitle>
        </DialogHeader>
        
        <Card className="border-primary/20 bg-gradient-soft">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                We'd love to hear about your experience so far
              </p>
            </div>
            
            {/* Star Rating */}
            <div className="space-y-3">
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleStarHover(star)}
                    onMouseLeave={handleStarLeave}
                    className="transition-all duration-150 hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || selectedRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              
              <p className="text-center text-sm font-medium">
                {getRatingText(hoveredRating || selectedRating)}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitRating}
                disabled={selectedRating === 0}
                variant="romance"
                className="flex-1"
              >
                Submit Rating
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Not Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewRequestModal;