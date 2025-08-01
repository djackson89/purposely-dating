import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, User, Sparkles, Calendar, MessageCircle } from 'lucide-react';
import { HeartIcon } from '@/components/ui/heart-icon';

interface OnboardingData {
  firstName: string;
  profilePhoto?: string;
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface SimpleOnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

const SimpleOnboarding: React.FC<SimpleOnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});

  const welcomeSteps = [
    {
      icon: Heart,
      title: "Welcome to Purposely",
      description: "Your dating strategist, self-love coach, and wingwoman all in one. Designed for women who refuse to settle."
    },
    {
      icon: MessageCircle,
      title: "Never Run Out of Things to Say",
      description: "Access 10,000+ expert-crafted conversation starters for dates, relationships, and personal growth."
    },
    {
      icon: Sparkles,
      title: "Practice Makes Perfect",
      description: "Use our AI Practice Partner to rehearse conversations, or let Text Genie craft the perfect reply for you."
    }
  ];

  const quizSteps = [
    {
      title: "What's your first name?",
      subtitle: "Let's personalize your experience",
      type: 'input',
      key: 'firstName'
    },
    {
      title: "What's your love language?",
      subtitle: "How do you prefer to give and receive love?",
      type: 'options',
      options: [
        "Words of Affirmation",
        "Quality Time", 
        "Physical Touch",
        "Acts of Service",
        "Receiving Gifts"
      ],
      key: 'loveLanguage'
    },
    {
      title: "What's your relationship status?",
      subtitle: "This helps us personalize your experience",
      type: 'options',
      options: [
        "Single & Looking",
        "Single & NOT Looking",
        "Dating",
        "In a Relationship", 
        "Married"
      ],
      key: 'relationshipStatus'
    },
    {
      title: "What's your age range?",
      subtitle: "Just to customize content for you",
      type: 'options',
      options: [
        "18-24",
        "25-34",
        "35-44", 
        "45+"
      ],
      key: 'age'
    },
    {
      title: "How would you describe yourself?",
      subtitle: "This helps us suggest perfect activities",
      type: 'options',
      options: [
        "Outgoing & Social",
        "Thoughtful & Introspective",
        "Balanced Mix of Both",
        "Adventurous & Spontaneous",
        "Calm & Steady"
      ],
      key: 'personalityType'
    }
  ];

  const isWelcomePhase = currentStep < welcomeSteps.length;
  const quizIndex = currentStep - welcomeSteps.length;

  const handleNext = () => {
    if (isWelcomePhase) {
      setCurrentStep(currentStep + 1);
    } else {
      // Quiz phase
      const currentQuizStep = quizSteps[quizIndex];
      
      if (quizIndex < quizSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Complete onboarding
        onComplete(formData as OnboardingData);
      }
    }
  };

  const handleQuizAnswer = (value: string) => {
    const currentQuizStep = quizSteps[quizIndex];
    const updatedData = { ...formData, [currentQuizStep.key]: value };
    setFormData(updatedData);

    if (quizIndex < quizSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(updatedData as OnboardingData);
    }
  };

  const handleInputChange = (value: string) => {
    const currentQuizStep = quizSteps[quizIndex];
    const updatedData = { ...formData, [currentQuizStep.key]: value };
    setFormData(updatedData);
  };

  if (isWelcomePhase) {
    const step = welcomeSteps[currentStep];
    const IconComponent = step.icon;

    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-romance border-primary/20 animate-fade-in-up">
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
              {welcomeSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentStep ? 'bg-primary w-6' : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <Button 
              onClick={handleNext}
              variant="romance"
              size="lg"
              className="w-full"
            >
              {currentStep === welcomeSteps.length - 1 ? "Let's Get Started! 💕" : "Next"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz phase
  const quizStep = quizSteps[quizIndex];

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-romance border-primary/20 animate-fade-in-up">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-gradient-romance rounded-full flex items-center justify-center text-white font-bold text-lg shadow-glow">
            {quizIndex + 1}
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
                  index === quizIndex ? 'bg-primary w-6' : 
                  index < quizIndex ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>

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

          {quizStep.type === 'options' && (
            <div className="space-y-3">
              {quizStep.options?.map((option) => {
                const isSelected = formData[quizStep.key as keyof OnboardingData] === option;
                return (
                  <Button
                    key={option}
                    onClick={() => handleQuizAnswer(option)}
                    variant={isSelected ? "romance" : "outline"}
                    className="w-full justify-start transition-all duration-300"
                  >
                    {option}
                  </Button>
                );
              })}
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground mt-4">
            Step {quizIndex + 1} of {quizSteps.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleOnboarding;