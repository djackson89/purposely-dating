import React, { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

interface ConversationStarter {
  category: string;
  masterCategory?: string;
  type?: string;
  prompts: (string | { statement: string; options: { key: string; text: string; }[] })[];
}

interface ConversationStartersCategoriesProps {
  filteredStarters: ConversationStarter[];
  customCategories: {[key: string]: any[]};
  selectedCategory: string;
  masterCategory: string;
  onSelectCategory: (category: string) => void;
  onSetMasterCategory: (category: string) => void;
}

const ConversationStartersCategories = memo<ConversationStartersCategoriesProps>(({
  filteredStarters,
  customCategories,
  selectedCategory,
  masterCategory,
  onSelectCategory,
  onSetMasterCategory,
}) => {
  // Memoized category data to prevent recreation
  const categoryData = useMemo(() => ({
    emojis: {
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
      "Fun & Playful": "🎭",
      "Pillow Talk & Tea": "🛏️",
      "Retrograde & Regrets": "🌙",
      "Vulnerable & Valid": "💕",
      "Hot Mess Express": "🚂"
    },
    descriptions: {
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
      "Fun & Playful": "Light-hearted questions for laughs and bonding",
      "Pillow Talk & Tea": "Spill your secrets with a flirty twist - bedroom confessions & sexy secrets",
      "Retrograde & Regrets": "Let the stars drag your dating life - zodiac-inspired relationship questions",
      "Vulnerable & Valid": "Safe space conversations for emotional intimacy and growth",
      "Hot Mess Express": "Unleash your chaos queen - girl-talk about dating drama"
    }
  }), []);

  const getDescription = (category: string): string => {
    return categoryData.descriptions[category] || "Explore meaningful conversation topics";
  };

  const getEmoji = (category: string): string => {
    return categoryData.emojis[category] || "💭";
  };

  return (
    <div className="space-y-3">
      {/* Master Category Selection */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium">Choose Category:</Label>
        <div className="flex gap-2">
          <Button
            variant={masterCategory === 'Date Night' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSetMasterCategory('Date Night')}
            className="rounded-full px-4 py-1 text-xs"
          >
            🌹 Date Night
          </Button>
          <Button
            variant={masterCategory === "Girl's Night" ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSetMasterCategory("Girl's Night")}
            className="rounded-full px-4 py-1 text-xs"
          >
            👯‍♀️ Girl's Night
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 gap-3">
        {/* Filtered categories */}
        {filteredStarters.map((starter) => (
          <Card
            key={starter.category}
            className={`cursor-pointer transition-all duration-200 border-2 ${
              selectedCategory === starter.category
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/50 hover:shadow-sm'
            }`}
            onClick={() => onSelectCategory(starter.category)}
          >
            <CardContent className="flex items-center p-4 space-x-4">
              <div className="text-2xl">
                {getEmoji(starter.category)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    {starter.category}
                  </h3>
                  {starter.type === 'multiple-choice' && (
                    <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                      Multiple Choice
                    </span>
                  )}
                  {starter.type === 'true-false' && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      True/False
                    </span>
                  )}
                  {starter.type === 'would-you-rather' && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      Would You Rather
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
            onClick={() => onSelectCategory(categoryName)}
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

        {/* Customize Option */}
        <Card
          className={`cursor-pointer transition-all duration-200 border-2 ${
            selectedCategory === "Customize"
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-border hover:border-primary/50 hover:shadow-sm'
          }`}
          onClick={() => onSelectCategory("Customize")}
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
  );
});

ConversationStartersCategories.displayName = 'ConversationStartersCategories';

export default ConversationStartersCategories;