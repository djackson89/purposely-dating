import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Share, Users, Trash2, Expand } from 'lucide-react';
import { InfoDialog } from '@/components/ui/info-dialog';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface ConversationStarter {
  category: string;
  type?: string;
  prompts: (string | { statement: string; options: { key: string; text: string; }[] })[];
}

interface ConversationStartersSectionProps {
  userProfile: OnboardingData;
  conversationStarters: ConversationStarter[];
  selectedCategory: string;
  customKeywords: string;
  currentStarters: (string | { statement: string; options: { key: string; text: string; }[] })[];
  currentQuestionIndex: number;
  isCustom: boolean;
  customCategories: {[key: string]: (string | { statement: string; options: { key: string; text: string; }[] })[]};
  savedPacks: {[key: string]: boolean};
  showRename: boolean;
  showManage: boolean;
  newCategoryName: string;
  depthLevel: number[];
  isLoading: boolean;
  isFullScreen: boolean;
  touchStart: { x: number; y: number };
  touchEnd: { x: number; y: number };
  showCategorySelection: boolean;
  setShowCategorySelection: (show: boolean) => void;
  setSelectedCategory: (category: string) => void;
  setCustomKeywords: (keywords: string) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setShowRename: (show: boolean) => void;
  setShowManage: (show: boolean) => void;
  setNewCategoryName: (name: string) => void;
  setDepthLevel: (level: number[]) => void;
  setTouchStart: (touch: { x: number; y: number }) => void;
  setTouchEnd: (touch: { x: number; y: number }) => void;
  selectCategory: (category: string) => void;
  generateCustomStarters: () => void;
  saveCurrentCustom: () => void;
  deleteCustomCategory: (category: string) => void;
  renameCustomCategory: () => void;
  previousQuestion: () => void;
  nextQuestion: () => void;
  openFullScreen: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  handleShare: (text: string) => void;
  isMultipleChoice: (question: string | { statement: string; options: { key: string; text: string; }[] }) => question is { statement: string; options: { key: string; text: string; }[] };
  getQuestionText: (question: string | { statement: string; options: { key: string; text: string; }[] }) => string;
}

const ConversationStartersSection: React.FC<ConversationStartersSectionProps> = ({
  userProfile,
  conversationStarters,
  selectedCategory,
  customKeywords,
  currentStarters,
  currentQuestionIndex,
  isCustom,
  customCategories,
  savedPacks,
  showRename,
  showManage,
  newCategoryName,
  depthLevel,
  isLoading,
  touchStart,
  touchEnd,
  showCategorySelection,
  setShowCategorySelection,
  setSelectedCategory,
  setCustomKeywords,
  setCurrentQuestionIndex,
  setShowRename,
  setShowManage,
  setNewCategoryName,
  setDepthLevel,
  setTouchStart,
  setTouchEnd,
  selectCategory,
  generateCustomStarters,
  saveCurrentCustom,
  deleteCustomCategory,
  renameCustomCategory,
  previousQuestion,
  nextQuestion,
  openFullScreen,
  handleTouchStart,
  handleTouchEnd,
  handleShare,
  isMultipleChoice,
  getQuestionText,
}) => {
  const categoryEmojis: { [key: string]: string } = {
    "First Date Deep Dive": "💬",
    "Relationship Clarity": "❤️",
    "Boundaries & Values": "🏠",
    "Trust & Transparency": "🔐",
    "Intimacy & Connection": "💝",
    "Communication & Conflict": "🗣️",
    "Red Flags & Green Flags": "🚩",
    "Emotional Intelligence": "🧠",
    "Values & Future Vision": "🔮",
    "Self-Awareness & Growth": "🌱",
    "Date Night Debates": "🎯",
    "Relationship Talk": "💕",
    "Getting to Know You": "🤝",
    "Future Plans": "🏡",
    "Personal Growth": "🌟",
    "Fun & Playful": "🎭"
  };

  const getDescription = (category: string): string => {
    const descriptions: { [key: string]: string } = {
      "First Date Deep Dive": "Explore deeper conversations and meaningful connections",
      "Relationship Clarity": "Understand love languages and emotional needs",
      "Boundaries & Values": "Navigate healthy limits and personal values",
      "Trust & Transparency": "Build trust through honest communication",
      "Intimacy & Connection": "Deepen physical and emotional bonds",
      "Communication & Conflict": "Master healthy disagreement and resolution",
      "Red Flags & Green Flags": "Identify positive and concerning relationship signs",
      "Emotional Intelligence": "Develop awareness and empathy skills",
      "Values & Future Vision": "Align on long-term goals and priorities",
      "Self-Awareness & Growth": "Foster personal development and healing",
      "Date Night Debates": "Spark engaging discussions with thought-provoking topics",
      "Relationship Talk": "Open conversations about your connection",
      "Getting to Know You": "Discover each other's personalities and histories",
      "Future Plans": "Discuss dreams, goals, and shared visions",
      "Personal Growth": "Explore self-improvement and development",
      "Fun & Playful": "Light-hearted questions for laughs and bonding"
    };
    return descriptions[category] || "Explore meaningful conversation topics";
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Section Heading */}
      <div className="flex items-center justify-center space-x-2">
        <h2 className="text-xl font-semibold text-primary">
          {showCategorySelection ? 'Conversation Starters' : selectedCategory}
        </h2>
        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
          <InfoDialog
            title="Conversation Starters"
            description="Discover engaging questions and topics that spark meaningful conversations. Swipe through cards or use our AI to generate custom questions based on your interests and dating style."
          />
        </div>
      </div>

      {/* Category Selection */}
      {showCategorySelection && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Choose Category:</Label>
          <div className="grid grid-cols-1 gap-3">
            {/* Date Night Debates first */}
            {conversationStarters
              .filter(starter => starter.category === "Date Night Debates")
              .map((starter) => (
                <Card
                  key={starter.category}
                  className={`cursor-pointer transition-all duration-200 border-2 ${
                    selectedCategory === starter.category
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:shadow-sm'
                  }`}
                  onClick={() => selectCategory(starter.category)}
                >
                  <CardContent className="flex items-center p-4 space-x-4">
                    <div className="text-2xl">🎯</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {starter.category}
                        </h3>
                        {starter.type === 'multiple-choice' && (
                          <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                            Debate
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getDescription(starter.category)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {/* Other predefined categories (excluding Date Night Debates) */}
            {conversationStarters
              .filter(starter => starter.category !== "Date Night Debates")
              .map((starter) => (
                <Card
                  key={starter.category}
                  className={`cursor-pointer transition-all duration-200 border-2 ${
                    selectedCategory === starter.category
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:shadow-sm'
                  }`}
                  onClick={() => selectCategory(starter.category)}
                >
                  <CardContent className="flex items-center p-4 space-x-4">
                    <div className="text-2xl">
                      {categoryEmojis[starter.category] || "💭"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {starter.category}
                        </h3>
                        {starter.type === 'multiple-choice' && (
                          <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                            Debate
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getDescription(starter.category)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {/* Custom Categories */}
            {Object.keys(customCategories).map((categoryName) => (
              <Card
                key={categoryName}
                className={`cursor-pointer transition-all duration-200 border-2 ${
                  selectedCategory === categoryName
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50 hover:shadow-sm'
                }`}
                onClick={() => selectCategory(categoryName)}
              >
                <CardContent className="flex items-center p-4 space-x-4">
                  <div className="text-2xl">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {categoryName}
                      </h3>
                      <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                        Custom
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your personalized conversation topics
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Customize Option at the bottom */}
            <Card
              className={`cursor-pointer transition-all duration-200 border-2 ${
                selectedCategory === "Customize"
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/50 hover:shadow-sm'
              }`}
              onClick={() => selectCategory("Customize")}
            >
              <CardContent className="flex items-center p-4 space-x-4">
                <div className="text-2xl">✨</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Customize</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate personalized conversation starters with AI
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Custom Input */}
      {selectedCategory === 'Customize' && showCategorySelection && (
        <Card className="shadow-soft border-primary/10">
          <CardContent className="pt-6 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Enter keywords (e.g., sexy, deep, funny)"
                value={customKeywords}
                onChange={(e) => setCustomKeywords(e.target.value)}
                className="flex-1 min-w-0"
              />
              <Button
                onClick={generateCustomStarters}
                disabled={isLoading || !customKeywords.trim()}
                variant="romance"
                className="whitespace-nowrap"
              >
                {isLoading ? '...' : 'Generate'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Display */}
      {!showCategorySelection && currentStarters.length > 0 && (
        <div className="space-y-4">
          {/* Back to Categories Button */}
          <Button
            onClick={() => setShowCategorySelection(true)}
            variant="outline"
            size="sm"
            className="mb-4"
          >
            ← Back to Categories
          </Button>

          {/* Question Card */}
          <div className="relative min-h-[300px] flex items-center justify-center">
            <Card
              className="w-full max-w-md mx-auto shadow-elegant border-primary/20 bg-gradient-romance transform transition-all duration-300 hover:scale-105 cursor-pointer select-none"
              style={{ minHeight: '250px' }}
              onClick={openFullScreen}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <CardContent className="p-8 flex flex-col justify-center items-center text-center h-full relative">
                <div className="absolute top-3 right-3">
                  <Expand className="w-5 h-5 text-white/70" />
                </div>

                <div className="flex items-center justify-center h-full w-full px-4">
                  {isMultipleChoice(currentStarters[currentQuestionIndex]) ? (
                    <div className="w-full text-center">
                      <p className="text-lg sm:text-xl font-bold text-white leading-tight mb-3">
                        {(currentStarters[currentQuestionIndex] as any).statement}
                      </p>
                      <div className="space-y-2 text-left">
                        {(currentStarters[currentQuestionIndex] as any).options.map((option: any) => (
                          <div key={option.key} className="text-white/90">
                            <span className="font-bold text-sm">{option.key}. </span>
                            <span className="text-sm font-bold leading-tight break-words">
                              {option.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xl sm:text-2xl font-bold text-white leading-relaxed text-center px-4">
                      {getQuestionText(currentStarters[currentQuestionIndex]).split('\n').map((line, index) => (
                        <div key={index} className={
                          index === 0 ? "mb-3" : 
                          line.match(/^[A-D]\.\s/) ? "text-left text-sm font-bold mb-1" : 
                          "text-left text-base mb-1"
                        }>
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Depth Slider */}
          <Card className="shadow-soft border-primary/10">
            <CardContent className="pt-6 pb-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-primary">Question Depth</span>
                  <div className="flex items-center gap-2">
                    {isLoading && (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {depthLevel[0] === 0 ? 'Light' : depthLevel[0] === 1 ? 'Casual' : 'Deep'}
                    </span>
                  </div>
                </div>
                <div className="px-2">
                  <Slider
                    value={depthLevel}
                    onValueChange={setDepthLevel}
                    max={2}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Light</span>
                    <span>Casual</span>
                    <span>Deep</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {depthLevel[0] === 0 && "Sarcastic & witty with dark humor"}
                  {depthLevel[0] === 1 && "Balanced mix of fun and thought-provoking"}
                  {depthLevel[0] === 2 && "Complex & meaningful for deep conversations"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center px-2 sm:px-4">
            <Button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              variant="soft"
              size="lg"
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4"
            >
              <span>←</span>
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <div className="flex space-x-2">
              {currentStarters.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextQuestion}
              disabled={isLoading}
              variant="soft"
              size="lg"
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Loading</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <span>→</span>
                </>
              )}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => handleShare(getQuestionText(currentStarters[currentQuestionIndex]))}
              variant="outline"
              className="w-full"
            >
              <Share className="w-4 h-4 mr-2" />
              Share This Question
            </Button>
          </div>

          {/* Save/Manage Custom Categories */}
          {isCustom && (
            <Card className="shadow-soft border-primary/10">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {!savedPacks[selectedCategory] ? (
                    <Button
                      onClick={saveCurrentCustom}
                      variant="romance"
                      size="sm"
                      className="w-full"
                    >
                      Save This Pack
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setShowManage(true)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Manage this Category
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Management Dialog */}
          {showManage && (
            <Card className="shadow-soft border-primary/10">
              <CardContent className="pt-6 space-y-3">
                <Label className="text-sm font-medium">Manage Category: {selectedCategory}</Label>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      setShowManage(false);
                      setShowRename(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Rename Category
                  </Button>
                  <Button
                    onClick={() => deleteCustomCategory(selectedCategory)}
                    variant="destructive"
                    size="sm"
                    className="w-full flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Category
                  </Button>
                  <Button
                    onClick={() => setShowManage(false)}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rename Dialog */}
          {showRename && (
            <Card className="shadow-soft border-primary/10">
              <CardContent className="pt-6 space-y-3">
                <Label className="text-sm font-medium">Rename Category:</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Enter new name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 min-w-0"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={renameCustomCategory}
                      disabled={!newCategoryName.trim()}
                      variant="romance"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRename(false);
                        setNewCategoryName('');
                      }}
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationStartersSection;
