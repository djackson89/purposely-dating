import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, Calendar, MessageCircle } from 'lucide-react';

interface OnboardingData {
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
  const [showTour, setShowTour] = useState(true);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});

  const tourSteps = [
    {
      icon: Heart,
      title: "Welcome to Your Love Journey! 💕",
      description: "I'm here to help you build deeper connections, plan amazing dates, and grow personally. Let's make your romantic life absolutely magical!"
    },
    {
      icon: MessageCircle,
      title: "Clarity Coach - Spark Connections ✨",
      description: "Get personalized conversation starters, clarity-building challenges, and practice with AI to boost your confidence!"
    },
    {
      icon: Calendar,
      title: "Date Concierge - Never Lose the Spark 🌟",
      description: "Discover amazing date ideas tailored to your love language and create shared planning boards with your partner!"
    },
    {
      icon: Sparkles,
      title: "Self-Love Journey - Grow Together 🌱",
      description: "Reflect, journal, and track your emotional growth with personalized prompts and insights!"
    }
  ];

  const quizSteps = [
    {
      title: "What's Your Love Language?",
      subtitle: "How do you prefer to give and receive love?",
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
      title: "What's Your Relationship Status?",
      subtitle: "This helps me personalize your experience",
      options: [
        "Dating",
        "In a Relationship", 
        "Married"
      ],
      key: 'relationshipStatus'
    },
    {
      title: "What's Your Age Range?",
      subtitle: "Just to customize content for you",
      options: [
        "18-24",
        "25-34",
        "35-44", 
        "45+"
      ],
      key: 'age'
    },
    {
      title: "How Would You Describe Your Personality?",
      subtitle: "This helps me suggest the perfect activities for you",
      options: [
        "Outgoing & Social (Extrovert)",
        "Thoughtful & Introspective (Introvert)",
        "Balanced Mix of Both",
        "Adventurous & Spontaneous",
        "Calm & Steady"
      ],
      key: 'personalityType'
    }
  ];

  const handleTourNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowTour(false);
      setCurrentStep(0);
    }
  };

  const handleQuizAnswer = (value: string) => {
    const currentQuizStep = quizSteps[currentStep];
    const updatedData = { ...formData, [currentQuizStep.key]: value };
    setFormData(updatedData);

    if (currentStep < quizSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      onComplete({
        ...updatedData,
        gender: 'female', // Default as specified for target audience
        age: updatedData.age || '25-34'
      } as OnboardingData);
    }
  };

  if (showTour) {
    const step = tourSteps[currentStep];
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
          </CardContent>
        </Card>
      </div>
    );
  }

  const quizStep = quizSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-romance border-primary/20 animate-fade-in-up">
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
          <div className="space-y-3">
            {quizStep.options.map((option) => (
              <Button
                key={option}
                onClick={() => handleQuizAnswer(option)}
                variant="outline"
                className="w-full justify-start hover:bg-primary/5 hover:border-primary hover:shadow-soft transition-all duration-300"
              >
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;