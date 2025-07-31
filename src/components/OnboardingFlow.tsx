import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, User } from 'lucide-react';

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
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleQuizAnswer = (value: string) => {
    const currentQuizStep = quizSteps[currentStep];
    const updatedData = { ...formData, [currentQuizStep.key]: value };
    setFormData(updatedData);

    if (currentStep < quizSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding directly
      onComplete(updatedData as OnboardingData);
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
      // Complete onboarding directly
      onComplete(formData as OnboardingData);
    }
  };

  const handleSkip = () => {
    if (currentStep < quizSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding directly
      onComplete(formData as OnboardingData);
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
        // Swiped left - next step (only for input/photo steps)
        const currentQuizStep = quizSteps[currentStep];
        if (currentQuizStep.type === 'input' || currentQuizStep.type === 'photo') {
          handleNext();
        }
      } else {
        // Swiped right - previous step
        if (currentStep > 0) {
          handleBack();
        }
      }
    }
  };

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