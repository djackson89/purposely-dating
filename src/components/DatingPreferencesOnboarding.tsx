import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Heart, X, ArrowRight, ArrowLeft } from 'lucide-react';

export interface DatingPreferences {
  likedActivities: string[];
  dislikedActivities: string[];
  customLikes: string[];
  customDislikes: string[];
}

interface DatingPreferencesOnboardingProps {
  onComplete: (preferences: DatingPreferences) => void;
  onSkip: () => void;
}

const predefinedActivities = [
  "Going out to restaurants",
  "Movies", 
  "Hiking",
  "Netflix & Chill",
  "Traveling",
  "Picnic",
  "Coffee Shop",
  "Night Clubs"
];

const DatingPreferencesOnboarding: React.FC<DatingPreferencesOnboardingProps> = ({
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [likedActivities, setLikedActivities] = useState<string[]>([]);
  const [dislikedActivities, setDislikedActivities] = useState<string[]>([]);
  const [customLike, setCustomLike] = useState('');
  const [customDislike, setCustomDislike] = useState('');
  const [customLikes, setCustomLikes] = useState<string[]>([]);
  const [customDislikes, setCustomDislikes] = useState<string[]>([]);

  const toggleActivity = (activity: string, type: 'like' | 'dislike') => {
    if (type === 'like') {
      setLikedActivities(prev => 
        prev.includes(activity) 
          ? prev.filter(a => a !== activity)
          : [...prev, activity]
      );
    } else {
      setDislikedActivities(prev => 
        prev.includes(activity) 
          ? prev.filter(a => a !== activity)
          : [...prev, activity]
      );
    }
  };

  const addCustomActivity = (type: 'like' | 'dislike') => {
    const input = type === 'like' ? customLike : customDislike;
    if (!input.trim()) return;

    if (type === 'like') {
      setCustomLikes(prev => [...prev, input.trim()]);
      setCustomLike('');
    } else {
      setCustomDislikes(prev => [...prev, input.trim()]);
      setCustomDislike('');
    }
  };

  const removeCustomActivity = (activity: string, type: 'like' | 'dislike') => {
    if (type === 'like') {
      setCustomLikes(prev => prev.filter(a => a !== activity));
    } else {
      setCustomDislikes(prev => prev.filter(a => a !== activity));
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      const preferences: DatingPreferences = {
        likedActivities,
        dislikedActivities,
        customLikes,
        customDislikes
      };
      onComplete(preferences);
    }
  };

  const canProceed = currentStep === 1 
    ? (likedActivities.length > 0 || customLikes.length > 0)
    : true; // Step 2 is optional

  return (
    <div className="pb-20 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
          Dating Preferences 💕
        </h1>
        <p className="text-muted-foreground">Help us personalize your perfect dates</p>
        <div className="flex justify-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>
      </div>

      {/* Step 1: Favorite Date Types */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fade-in-up">
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>What are your favorite kinds of dates?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select all that apply. We'll use this to suggest perfect dates for you.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {predefinedActivities.map((activity) => (
                  <Button
                    key={activity}
                    onClick={() => toggleActivity(activity, 'like')}
                    variant={likedActivities.includes(activity) ? "romance" : "outline"}
                    className="h-auto p-3 text-left justify-start"
                  >
                    {activity}
                  </Button>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <Label>Other activities you love:</Label>
                <div className="flex space-x-2">
                  <Input
                    value={customLike}
                    onChange={(e) => setCustomLike(e.target.value)}
                    placeholder="Type your favorite activity..."
                    onKeyPress={(e) => e.key === 'Enter' && addCustomActivity('like')}
                  />
                  <Button onClick={() => addCustomActivity('like')} variant="outline">
                    Add
                  </Button>
                </div>
                
                {customLikes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customLikes.map((activity) => (
                      <Badge key={activity} variant="default" className="flex items-center space-x-1">
                        <span>{activity}</span>
                        <button onClick={() => removeCustomActivity(activity, 'like')}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Date Turn-offs */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in-up">
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <X className="w-5 h-5 text-destructive" />
                <span>Are there any of these that would absolutely turn you off?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This helps us avoid suggesting dates you wouldn't enjoy. Feel free to skip if nothing applies.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {predefinedActivities.map((activity) => (
                  <Button
                    key={activity}
                    onClick={() => toggleActivity(activity, 'dislike')}
                    variant={dislikedActivities.includes(activity) ? "destructive" : "outline"}
                    className="h-auto p-3 text-left justify-start"
                  >
                    {activity}
                  </Button>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <Label>Other activities you'd prefer to avoid:</Label>
                <div className="flex space-x-2">
                  <Input
                    value={customDislike}
                    onChange={(e) => setCustomDislike(e.target.value)}
                    placeholder="Type activities you dislike..."
                    onKeyPress={(e) => e.key === 'Enter' && addCustomActivity('dislike')}
                  />
                  <Button onClick={() => addCustomActivity('dislike')} variant="outline">
                    Add
                  </Button>
                </div>
                
                {customDislikes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customDislikes.map((activity) => (
                      <Badge key={activity} variant="destructive" className="flex items-center space-x-1">
                        <span>{activity}</span>
                        <button onClick={() => removeCustomActivity(activity, 'dislike')}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <div className="flex space-x-2">
          {currentStep > 1 && (
            <Button onClick={() => setCurrentStep(currentStep - 1)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button onClick={onSkip} variant="ghost">
            Skip for now
          </Button>
        </div>

        <Button 
          onClick={handleNext}
          disabled={!canProceed}
          variant="romance"
          className="min-w-24"
        >
          {currentStep === 1 ? (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            "Complete Setup"
          )}
        </Button>
      </div>
    </div>
  );
};

export default DatingPreferencesOnboarding;