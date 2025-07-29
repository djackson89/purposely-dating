import React, { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Share, ChevronLeft, ChevronRight, Users, Trash2, Expand, Send } from 'lucide-react';
import { InfoDialog } from '@/components/ui/info-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConversationStartersCategories from './ConversationStartersCategories';
import ConversationStartersDisplay from './ConversationStartersDisplay';
import { useConversationStarters } from '@/hooks/useConversationStarters';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface ConversationStarter {
  category: string;
  masterCategory?: string;
  type?: string;
  prompts: (string | { statement: string; options: { key: string; text: string; }[] })[];
}

interface ConversationStartersSectionProps {
  userProfile: OnboardingData;
  conversationStarters: ConversationStarter[];
  handleShare: (text: string) => void;
}

const ConversationStartersSection = memo<ConversationStartersSectionProps>(({
  userProfile,
  conversationStarters,
  handleShare,
}) => {
  // Use the optimized hook for all conversation starters logic
  const {
    masterCategory,
    selectedCategory,
    currentStarters,
    currentQuestionIndex,
    customKeywords,
    isCustom,
    customCategories,
    savedPacks,
    depthLevel,
    isTransforming,
    setMasterCategory,
    setCustomKeywords,
    setDepthLevel,
    selectCategory,
    generateCustomStarters,
    nextQuestion,
    previousQuestion,
    saveCurrentCustom,
    deleteCustomCategory,
    isMultipleChoice,
    getQuestionText,
    filteredStarters,
  } = useConversationStarters(userProfile, conversationStarters);

  // Local UI state
  const [showCategorySelection, setShowCategorySelection] = useState(true);
  const [showRename, setShowRename] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY });
    
    const deltaX = touchStart.x - e.changedTouches[0].clientX;
    const deltaY = Math.abs(touchStart.y - e.changedTouches[0].clientY);
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0) {
        nextQuestion();
      } else {
        previousQuestion();
      }
    }
  };

  const openFullScreen = () => setIsFullScreen(true);

  const renameCustomCategory = () => {
    if (newCategoryName.trim()) {
      // Logic for renaming would go here
      setShowRename(false);
      setNewCategoryName('');
    }
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
        <ConversationStartersCategories
          filteredStarters={filteredStarters}
          customCategories={customCategories}
          selectedCategory={selectedCategory}
          masterCategory={masterCategory}
          onSelectCategory={(category) => {
            selectCategory(category);
            if (category !== 'Customize') {
              setShowCategorySelection(false);
            }
          }}
          onSetMasterCategory={setMasterCategory}
        />
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
                onClick={() => {
                  generateCustomStarters();
                  setShowCategorySelection(false);
                }}
                disabled={isTransforming || !customKeywords.trim()}
                variant="romance"
                className="whitespace-nowrap"
              >
                {isTransforming ? '...' : 'Generate'}
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

          {/* Question Display Component */}
          <ConversationStartersDisplay
            currentStarters={currentStarters}
            currentQuestionIndex={currentQuestionIndex}
            isMultipleChoice={isMultipleChoice}
            getQuestionText={getQuestionText}
            onExpand={openFullScreen}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />

          {/* Depth Slider */}
          <Card className="shadow-soft border-primary/10">
            <CardContent className="pt-6 pb-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-primary">Question Depth</span>
                  <div className="flex items-center gap-2">
                    {isTransforming && (
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
              variant="soft"
              size="lg"
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <div className="flex space-x-2">
              {currentStarters.slice(0, 10).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
              {currentStarters.length > 10 && <span className="text-xs text-muted-foreground">...</span>}
            </div>

            <Button
              onClick={nextQuestion}
              disabled={isTransforming}
              variant="soft"
              size="lg"
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => handleShare(getQuestionText(currentStarters[currentQuestionIndex]))}
              variant="romance"
              className="w-full"
            >
              <Share className="w-4 h-4 mr-2" />
              Ask A Friend
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

      {/* Full Screen Dialog */}
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="w-full max-w-lg bg-gradient-romance border-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Question View</DialogTitle>
          </DialogHeader>
          <div 
            className="p-8 min-h-[400px] flex items-center justify-center text-center"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {currentStarters.length > 0 && (
              <div className="text-white">
                {isMultipleChoice(currentStarters[currentQuestionIndex]) ? (
                  <div className="space-y-4">
                    <p className="text-xl font-bold leading-tight">
                      {(currentStarters[currentQuestionIndex] as any).statement}
                    </p>
                    <div className="space-y-3 text-left">
                      {(currentStarters[currentQuestionIndex] as any).options.map((option: any) => (
                        <div key={option.key} className="text-white/90">
                          <span className="font-bold">{option.key}. </span>
                          <span className="font-medium">{option.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xl font-bold leading-relaxed">
                    {getQuestionText(currentStarters[currentQuestionIndex])}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

ConversationStartersSection.displayName = 'ConversationStartersSection';

export default ConversationStartersSection;