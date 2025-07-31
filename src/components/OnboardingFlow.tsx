import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Sparkles, Calendar, MessageCircle, Camera, User } from 'lucide-react';
import { HeartIcon } from '@/components/ui/heart-icon';
import NotificationPermissionStep from '@/components/NotificationPermissionStep';

interface OnboardingData {
  firstName: string;
  profilePhoto?: string;
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  showOnlyWelcome?: boolean;
  showOnlyQuiz?: boolean;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, showOnlyWelcome = false, showOnlyQuiz = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(showOnlyWelcome || (!showOnlyQuiz));
  const [showNotificationStep, setShowNotificationStep] = useState(false);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tourSteps = [
    {
      icon: Heart,
      title: "Your dating strategist, self-love coach, and wingwoman all in one",
      description: "Designed by world-class relationship experts for women who refuse to settle. Master the art of intentional dating and attract the love you truly deserve."
    },
    {
      icon: MessageCircle,
      title: "Boring small talk? Gone!",
      description: "The mental stimulation never ends with our relationship expert-crafted conversation starters. Whether it's a deep date night discussion or a naughty girl's night in, we've got 10,000+ questions to keep boredom away for good!"
    },
    {
      icon: Sparkles,
      title: "Send the Perfect Reply Every Time",
      description: "Our built in Practice Partner will let you practice flirting, setting boundaries, or deep convos with zero judgment. Or...just tag our Text Genie in and we'll craft the perfect reply for you!"
    },
    {
      icon: Calendar,
      title: "Date Concierge & Planning 🗓️",
      description: "Discover curated date ideas that align with your values and love language. Move beyond coffee dates to experiences that reveal true compatibility and character."
    },
    {
      icon: HeartIcon,
      title: "Therapy Companion & Growth 🌱",
      description: "Daily reflection prompts and emotional intelligence tools designed by licensed therapists. Track your growth and maintain the self-awareness that attracts high-quality partners."
    }
  ];

  const quizSteps = [
    {
      title: "What's Your First Name?",
      subtitle: "We'd love to personalize your experience",
      type: 'input',
      key: 'firstName',
      icon: User
    },
    {
      title: "Add Your Profile Photo",
      subtitle: "This helps us personalize your journey (optional)",
      type: 'photo',
      key: 'profilePhoto',
      icon: Camera
    },
    {
      title: "What's Your Love Language?",
      subtitle: "How do you prefer to give and receive love?",
      type: 'options',
      options: [
        "Words of Affirmation",
        "Quality Time", 
        "Physical Touch",
        "Acts of Service",
        "Receiving Gifts",
        "Not sure"
      ],
      key: 'loveLanguage'
    },
    {
      title: "What's Your Relationship Status?",
      subtitle: "This helps me personalize your experience",
      type: 'options',
      options: [
        "Single & Looking",
        "Single & NOT Looking",
        "Dating",
        "In a Relationship", 
        "Married",
        "Not sure"
      ],
      key: 'relationshipStatus'
    },
    {
      title: "What's Your Age Range?",
      subtitle: "Just to customize content for you",
      type: 'options',
      options: [
        "18-24",
        "25-34",
        "35-44", 
        "45+",
        "Not sure"
      ],
      key: 'age'
    },
    {
      title: "How Would You Describe Your Personality?",
      subtitle: "This helps me suggest the perfect activities for you",
      type: 'options',
      options: [
        "Outgoing & Social (Extrovert)",
        "Thoughtful & Introspective (Introvert)",
        "Balanced Mix of Both",
        "Adventurous & Spontaneous",
        "Calm & Steady",
        "Not sure"
      ],
      key: 'personalityType'
    }
  ];

  const handleTourNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (showOnlyWelcome) {
        // Complete welcome tour directly
        onComplete({} as OnboardingData);
      } else {
        setShowTour(false);
        setCurrentStep(0);
      }
    }
  };

  const handleQuizAnswer = (value: string) => {
    const currentQuizStep = quizSteps[currentStep];
    const updatedData = { ...formData, [currentQuizStep.key]: value };
    setFormData(updatedData);

    if (currentStep < quizSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete quiz directly when in quiz-only mode
      if (showOnlyQuiz) {
        onComplete(updatedData as OnboardingData);
      } else {
        // Show notification permission step after quiz completion
        setShowNotificationStep(true);
      }
    }
  };

  const handleInputChange = (value: string) => {
    const currentQuizStep = quizSteps[currentStep];
    const updatedData = { ...formData, [currentQuizStep.key]: value };
    setFormData(updatedData);
  };

  const handleNext = () => {
    if (currentStep < quizSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete quiz directly when in quiz-only mode
      if (showOnlyQuiz) {
        onComplete(formData as OnboardingData);
      } else {
        // Show notification permission step after quiz completion
        setShowNotificationStep(true);
      }
    }
  };

  const handleSkip = () => {
    if (currentStep < quizSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete quiz directly when in quiz-only mode
      if (showOnlyQuiz) {
        onComplete(formData as OnboardingData);
      } else {
        // Show notification permission step after quiz completion
        setShowNotificationStep(true);
      }
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const updatedData = { ...formData, profilePhoto: result };
        setFormData(updatedData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleNotificationStepComplete = () => {
    // Complete onboarding after notification step
    onComplete(formData as OnboardingData);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    });
    
    const deltaX = touchStart.x - e.changedTouches[0].clientX;
    const deltaY = touchStart.y - e.changedTouches[0].clientY;
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swiped left - next step
        if (showTour) {
          handleTourNext();
        }
      } else {
        // Swiped right - previous step
        if (!showTour && currentStep > 0) {
          handleBack();
        }
      }
    }
  };

  // Show notification permission step after quiz completion
  if (showNotificationStep) {
    return (
      <NotificationPermissionStep 
        onComplete={handleNotificationStepComplete}
        userProfile={formData}
      />
    );
  }

  if (showTour) {
    const step = tourSteps[currentStep];
    const IconComponent = step.icon;

    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <Card 
          className="w-full max-w-md shadow-romance border-primary/20 animate-fade-in-up select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-romance rounded-full flex items-center justify-center shadow-glow">
              <IconComponent className="w-8 h-8 text-white animate-heart-pulse" />
            </div>
            <CardTitle className="text-xl font-semibold bg-gradient-romance bg-clip-text text-transparent">
              {step.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>
            <div className="flex justify-center space-x-2">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentStep ? 'bg-primary w-6' : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <Button 
              onClick={handleTourNext}
              variant="romance"
              size="lg"
              className="w-full"
            >
              {currentStep === tourSteps.length - 1 ? "Let's Get Started! 💕" : "Next"}
            </Button>
            <p className="text-xs text-muted-foreground/70">
              Swipe left/right to navigate
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quizStep = quizSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card 
        className="w-full max-w-md shadow-romance border-primary/20 animate-fade-in-up select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-gradient-romance rounded-full flex items-center justify-center text-white font-bold text-lg shadow-glow">
            {currentStep + 1}
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">
            {quizStep.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {quizStep.subtitle}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center space-x-2 mb-6">
            {quizSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep ? 'bg-primary w-6' : 
                  index < currentStep ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>

          {/* Render different input types based on quiz step */}
          {quizStep.type === 'input' && (
            <div className="space-y-4">
              <Input
                placeholder="Enter your first name"
                value={formData.firstName || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full text-center text-lg"
              />
              <Button
                onClick={handleNext}
                variant="romance"
                size="lg"
                className="w-full"
                disabled={!formData.firstName || formData.firstName.trim() === ''}
              >
                Next
              </Button>
            </div>
          )}

          {quizStep.type === 'photo' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex flex-col items-center space-y-4">
                {formData.profilePhoto ? (
                  <div className="relative">
                    <img
                      src={formData.profilePhoto}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                    />
                    <Button
                      onClick={handlePhotoButtonClick}
                      variant="outline"
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 p-0"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={handlePhotoButtonClick}
                    className="w-32 h-32 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <Camera className="w-8 h-8 text-primary/50" />
                  </div>
                )}
                <Button
                  onClick={handlePhotoButtonClick}
                  variant="outline"
                  className="w-full"
                >
                  {formData.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                </Button>
              </div>
              <Button
                onClick={handleNext}
                variant="romance"
                size="lg"
                className="w-full"
              >
                {formData.profilePhoto ? 'Next' : 'Skip for Now'}
              </Button>
            </div>
          )}

          {quizStep.type === 'options' && (
            <div className="space-y-3">
              {quizStep.options?.map((option) => {
                const isSelected = formData[quizStep.key as keyof OnboardingData] === option;
                return (
                  <Button
                    key={option}
                    onClick={() => handleQuizAnswer(option)}
                    variant={isSelected ? "romance" : "outline"}
                    className={`w-full justify-start transition-all duration-300 ${
                      isSelected 
                        ? "shadow-romance text-burgundy font-semibold" 
                        : "hover:bg-primary/5 hover:border-primary hover:shadow-soft"
                    }`}
                  >
                    {option}
                  </Button>
                );
              })}
            </div>
          )}
          
          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button
              onClick={handleBack}
              variant="ghost"
              className={`${currentStep === 0 ? "invisible" : ""}`}
            >
              Back
            </Button>
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
            >
              Skip
            </button>
          </div>
          
          <p className="text-xs text-muted-foreground/70 text-center">
            Swipe left/right to navigate
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;