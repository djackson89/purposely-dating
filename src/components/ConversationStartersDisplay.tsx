import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Expand } from 'lucide-react';

interface ConversationStartersDisplayProps {
  currentStarters: (string | { statement: string; options: { key: string; text: string; }[] })[];
  currentQuestionIndex: number;
  isMultipleChoice: (question: string | { statement: string; options: { key: string; text: string; }[] }) => question is { statement: string; options: { key: string; text: string; }[] };
  getQuestionText: (question: string | { statement: string; options: { key: string; text: string; }[] }) => string;
  onExpand: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

const ConversationStartersDisplay = memo<ConversationStartersDisplayProps>(({
  currentStarters,
  currentQuestionIndex,
  isMultipleChoice,
  getQuestionText,
  onExpand,
  onTouchStart,
  onTouchEnd,
}) => {
  if (currentStarters.length === 0) {
    return null;
  }

  const currentQuestion = currentStarters[currentQuestionIndex];

  return (
    <div className="relative min-h-[300px] flex items-center justify-center">
      <Card
        className="w-full max-w-md mx-auto shadow-elegant border-primary/20 bg-gradient-romance transform transition-all duration-300 hover:scale-105 cursor-pointer select-none"
        style={{ minHeight: '250px' }}
        onClick={onExpand}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <CardContent className="p-8 flex flex-col justify-center items-center text-center h-full relative">
          <div className="absolute top-3 right-3">
            <Expand className="w-5 h-5 text-white/70" />
          </div>

          <div className="flex items-center justify-center h-full w-full px-4">
            {isMultipleChoice(currentQuestion) ? (
              <div className="w-full text-center">
                <p className="text-lg sm:text-xl font-bold text-white leading-tight mb-3">
                  {currentQuestion.statement}
                </p>
                <div className="space-y-2 text-left">
                  {currentQuestion.options.map((option) => (
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
                {getQuestionText(currentQuestion).split('\n').map((line, index) => (
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
  );
});

ConversationStartersDisplay.displayName = 'ConversationStartersDisplay';

export default ConversationStartersDisplay;