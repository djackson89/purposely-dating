import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Zap, Share, Wand2, Trash2, Users, X, ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { HeartIcon } from '@/components/ui/heart-icon';
import { InfoDialog } from '@/components/ui/info-dialog';
import { Share as CapacitorShare } from '@capacitor/share';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import TextGenie from '@/components/TextGenie';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface FlirtFuelModuleProps {
  userProfile: OnboardingData;
}

const FlirtFuelModule: React.FC<FlirtFuelModuleProps> = ({ userProfile }) => {
  const [activeSection, setActiveSection] = useState<'starters' | 'practice' | 'textgenie'>('starters');
  const [showCategoryGrid, setShowCategoryGrid] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('First Date Deep Dive');
  const [currentStarters, setCurrentStarters] = useState<(string | { statement: string; options: { key: string; text: string; }[] })[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [depthLevel, setDepthLevel] = useState([1]); // 0=Light, 1=Casual, 2=Deep
  const { getFlirtSuggestion, getAIResponse, isLoading } = useRelationshipAI();

  // Category data with icons and descriptions
  const categoryData = [
    {
      name: "First Date Deep Dive",
      icon: "💭",
      description: "Get past small talk and into meaningful conversation on your first date"
    },
    {
      name: "Date Night Debates",
      icon: "⚖️", 
      description: "Spicy takes and controversial topics to spark heated discussions"
    },
    {
      name: "Relationship Clarity",
      icon: "💕",
      description: "Understand love languages and emotional needs in partnerships"
    }
  ];

  // Sample conversation starters
  const conversationStarters = [
    {
      category: "First Date Deep Dive",
      prompts: [
        "What's something you believed as a child that you now find hilarious?",
        "If you could have dinner with anyone, dead or alive, who would it be?",
        "What's the weirdest food combination you actually enjoy?"
      ]
    },
    {
      category: "Date Night Debates",
      type: "multiple-choice",
      prompts: [
        {
          statement: "If a man is broke, he's automatically less attractive—no matter how good his heart is.",
          options: [
            { key: "A", text: "Strongly Agree — Struggle love expired in the 90s" },
            { key: "B", text: "Somewhat Agree — Intentions don't pay bills" },
            { key: "C", text: "Somewhat Disagree — Broke isn't forever" },
            { key: "D", text: "Strongly Disagree — Y'all too materialistic to know real love" }
          ]
        }
      ]
    }
  ];

  // Helper functions
  const isMultipleChoice = (question: string | { statement: string; options: { key: string; text: string; }[] }): question is { statement: string; options: { key: string; text: string; }[] } => {
    return typeof question === 'object' && 'statement' in question;
  };

  const getQuestionText = (question: string | { statement: string; options: { key: string; text: string; }[] }): string => {
    return isMultipleChoice(question) ? question.statement : question;
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setShowCategoryGrid(false);
    
    const category = conversationStarters.find(cat => cat.category === categoryName);
    if (category) {
      setCurrentStarters(category.prompts);
      setCurrentQuestionIndex(0);
    }
  };

  const goBackToCategoryGrid = () => {
    setShowCategoryGrid(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < currentStarters.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex justify-center space-x-2 mb-6">
        {[
          { key: 'starters', icon: MessageCircle, label: 'Starters' },
          { key: 'textgenie', icon: Wand2, label: 'Text Genie' },
          { key: 'practice', icon: Users, label: 'Practice' }
        ].map(({ key, icon: IconComponent, label }) => (
          <Button
            key={key}
            onClick={() => setActiveSection(key as any)}
            variant={activeSection === key ? "default" : "outline"}
            className={`flex items-center space-x-2 transition-all ${
              activeSection === key 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'hover:bg-primary/10'
            }`}
          >
            <IconComponent className="w-5 h-5" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        ))}
      </div>

      {/* Conversation Starters Section */}
      {activeSection === 'starters' && (
        <div className="space-y-4 animate-fade-in-up">
          {showCategoryGrid ? (
            // Category Grid View
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <h2 className="text-xl font-semibold text-primary">Choose Your Category</h2>
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
                  <InfoDialog
                    title="Conversation Starters"
                    description="Discover engaging questions and topics that spark meaningful conversations. Choose a category that matches your vibe and dive into thought-provoking discussions."
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                {categoryData.map((category) => (
                  <Card 
                    key={category.name}
                    className="bg-gradient-to-r from-card/80 to-card/60 border-primary/20 hover:border-primary/40 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] shadow-soft"
                    onClick={() => handleCategorySelect(category.name)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl sm:text-3xl flex-shrink-0">
                          {category.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
                            {category.name.toUpperCase()}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            // Question Interface
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  onClick={goBackToCategoryGrid}
                  variant="ghost"
                  className="text-primary hover:text-primary/80 p-2"
                >
                  ← Categories
                </Button>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-primary">Conversation Starters</h2>
                </div>
              </div>

              {currentStarters.length > 0 && (
                <div className="space-y-4">
                  {/* Question Card */}
                  <Card 
                    className="w-full max-w-md mx-auto shadow-elegant border-primary/20 bg-gradient-romance transform transition-all duration-300 hover:scale-105 cursor-pointer select-none"
                    style={{ minHeight: '250px' }}
                    onClick={() => setIsFullScreen(true)}
                  >
                    <CardContent className="p-8 flex flex-col justify-center items-center text-center h-full relative">
                      <div className="absolute top-3 right-3">
                        <Expand className="w-5 h-5 text-white/70" />
                      </div>
                      
                      <div className="flex items-center justify-center h-full w-full px-4">
                        {isMultipleChoice(currentStarters[currentQuestionIndex]) ? (
                          <div className="w-full text-center">
                            <p className="text-lg sm:text-xl font-bold text-white leading-tight mb-3">
                              {currentStarters[currentQuestionIndex].statement}
                            </p>
                            <div className="space-y-2 text-left">
                              {currentStarters[currentQuestionIndex].options.map((option) => (
                                <div key={option.key} className="text-white/90">
                                  <span className="font-bold text-sm">{option.key}. </span>
                                  <span className="text-xs leading-tight break-words">
                                    {option.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xl sm:text-2xl font-bold text-white leading-relaxed text-center px-4">
                            {getQuestionText(currentStarters[currentQuestionIndex])}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Navigation */}
                  <div className="flex justify-between items-center px-4">
                    <Button onClick={previousQuestion} variant="outline" size="sm">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentQuestionIndex + 1} of {currentStarters.length}
                    </span>
                    <Button onClick={nextQuestion} variant="outline" size="sm">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Text Genie Section */}
      {activeSection === 'textgenie' && (
        <div className="animate-fade-in-up">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <h2 className="text-xl font-semibold text-primary">Text Genie</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <InfoDialog
                title="Text Genie"
                description="Get AI-powered help crafting the perfect text message replies."
              />
            </div>
          </div>
          <TextGenie userProfile={userProfile} />
        </div>
      )}

      {/* AI Practice Section */}
      {activeSection === 'practice' && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">AI Practice</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <InfoDialog
                title="AI Practice Partner"
                description="Practice your conversation skills with our AI."
              />
            </div>
          </div>
          <div className="text-center p-8 text-muted-foreground">
            AI Practice functionality coming soon...
          </div>
        </div>
      )}

      {/* Full Screen Dialog */}
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-full h-full bg-gradient-romance border-none p-0">
          <div className="relative w-full h-full flex flex-col">
            {/* Close button */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                onClick={() => setIsFullScreen(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Question content */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-full px-4 sm:px-8">
                {isMultipleChoice(currentStarters[currentQuestionIndex]) ? (
                  <div className="w-full">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight mb-6 sm:mb-8">
                      {currentStarters[currentQuestionIndex].statement}
                    </p>
                    <div className="space-y-3 sm:space-y-4 text-left max-w-4xl mx-auto">
                      {currentStarters[currentQuestionIndex].options.map((option) => (
                        <div key={option.key} className="text-white/90">
                          <span className="font-bold text-lg sm:text-xl mr-3">{option.key}.</span>
                          <span className="text-base sm:text-lg leading-relaxed break-words">
                            {option.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight px-2">
                    {getQuestionText(currentStarters[currentQuestionIndex])}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlirtFuelModule;