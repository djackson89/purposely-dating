import React, { useState } from 'react';
import ConversationStartersSection from '../ConversationStartersSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Zap, Share, Send, Wand2, Trash2, Users, X, ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { HeartIcon } from '@/components/ui/heart-icon';
import { InfoDialog } from '@/components/ui/info-dialog';
import { Share as CapacitorShare } from '@capacitor/share';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import { useConversationStarters } from '@/hooks/useConversationStarters';
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
  
  // Practice partner state
  const [practicePartnerActive, setPracticePartnerActive] = useState(false);
  const [practiceMessages, setPracticeMessages] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([]);
  const [currentPracticeMessage, setCurrentPracticeMessage] = useState('');
  const [practiceScenario, setPracticeScenario] = useState('first_date');
  const [showPracticeInput, setShowPracticeInput] = useState(false);
  const [currentScenarioText, setCurrentScenarioText] = useState('');
  const [sessionFeedback, setSessionFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  
  const { getFlirtSuggestion, getAIResponse, isLoading } = useRelationshipAI();

  // Define conversation starters here before the hook  
  const conversationStarters = [
    {
      category: "First Date Deep Dive",
      masterCategory: "Date Night",
      prompts: userProfile.personalityType.includes("Outgoing") 
        ? [
            "What belief you held strongly in your twenties has completely shifted as you've grown?",
            "What's something you're working on healing within yourself right now?",
            "How do you know when someone truly sees and appreciates the real you?",
            "What pattern do you notice in the type of people you're drawn to?",
            "What does emotional maturity look like to you in a relationship?",
            "What's a conversation topic that instantly reveals someone's character to you?"
          ]
        : [
            "What's something you've learned about yourself from your past relationships that surprised you?",
            "How do you distinguish between healthy attachment and codependency?",
            "What's one way your family dynamics shaped your approach to love?",
            "When have you had to choose between what others wanted for you and what you wanted for yourself?",
            "What does it mean to you when someone truly understands you?",
            "How do you recognize when someone is emotionally available versus just saying the right things?"
          ]
    },
    {
      category: "Relationship Clarity",
      masterCategory: "Date Night", 
      prompts: [
        `Since your love language is ${userProfile.loveLanguage}, how do you communicate when you're not feeling loved in that way?`,
        "What's the difference between how you show love when you feel secure versus when you feel anxious?",
        "How do you handle it when your partner processes emotions differently than you do?",
        "What helps you feel emotionally safe enough to be completely vulnerable?",
        "How do you distinguish between a partner having a bad day and a pattern of treating you poorly?",
        "What does it look like when someone truly prioritizes you versus just fitting you into their schedule?",
        "How do you navigate wanting to help someone you love while respecting their autonomy?",
        "What's your experience with the difference between being wanted and being needed?"
      ]
    },
    {
      category: "Boundaries & Values",
      masterCategory: "Date Night",
      prompts: [
        "How do you feel about maintaining friendships with people of the opposite sex while in a relationship?",
        "What are your thoughts on partner transparency with social media interactions and online activities?",
        "How comfortable are you with the idea of girls' trips or guys' outings without your partner?",
        "What boundaries should couples have regarding communication with ex-partners?",
        "How do you define emotional cheating, and where do you draw those lines?",
        "What are your views on sharing passwords or access to personal devices in a relationship?",
        "How should couples handle situations where one partner feels jealous or insecure?",
        "What boundaries do you think are necessary for work relationships with the opposite sex?",
        "How do you feel about attending social events where alcohol is involved when your partner isn't present?",
        "What's your stance on keeping in touch with people who have expressed romantic interest in you?",
        "How do couples balance individual social lives with being a united couple?",
        "What are your thoughts on the types of content that should be off-limits to consume in a relationship?"
      ]
    }
  ];

  // Use conversation starters hook
  const conversationStartersHook = useConversationStarters(userProfile, conversationStarters);

  // Helper function to check if current question is multiple choice
  const isMultipleChoice = (question: string | { statement: string; options: { key: string; text: string; }[] }): question is { statement: string; options: { key: string; text: string; }[] } => {
    return typeof question === 'object' && 'statement' in question;
  };

  // Helper function to get question text
  const getQuestionText = (question: string | { statement: string; options: { key: string; text: string; }[] }): string => {
    return isMultipleChoice(question) ? question.statement : question;
  };

  const handleShare = async (text: string) => {
    // Detect device type for appropriate app store link
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let appStoreLink = 'https://purposely.app'; // Default fallback
    if (isIOS) {
      appStoreLink = 'https://apps.apple.com/app/purposely-dating'; // Replace with actual iOS App Store link
    } else if (isAndroid) {
      appStoreLink = 'https://play.google.com/store/apps/details?id=com.purposely.dating'; // Replace with actual Google Play link
    }
    
    const shareText = `${text}\n\nSent with Purposely App\n${appStoreLink}`;
    
    try {
      // Try Capacitor Share first (for mobile)
      if ((window as any).Capacitor) {
        await CapacitorShare.share({
          title: 'Conversation Starter from Purposely App',
          text: shareText,
        });
      } else {
        // Fallback to Web Share API
        if (navigator.share) {
          await navigator.share({
            title: 'Conversation Starter from Purposely App',
            text: shareText,
          });
        } else {
          // Fallback to clipboard
          await navigator.clipboard.writeText(shareText);
          alert('Copied to clipboard!');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Final fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Copied to clipboard!');
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
      }
    }
  };

  const handlePracticeSubmit = async () => {
    if (!currentPracticeMessage.trim()) return;
    
    const userMessage = { role: 'user' as const, message: currentPracticeMessage };
    setPracticeMessages(prev => [...prev, userMessage]);
    setCurrentPracticeMessage('');
    
    try {
      const prompt = `You are role-playing a ${practiceScenario} scenario. Respond as the other person would, keeping it engaging and realistic. User said: "${currentPracticeMessage}"`;
      const response = await getAIResponse(prompt, userProfile, 'flirt');
      
      const aiMessage = { role: 'ai' as const, message: response };
      setPracticeMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
    }
  };

  const handleEndSession = async () => {
    if (practiceMessages.length > 0) {
      try {
        const conversation = practiceMessages.map(msg => `${msg.role}: ${msg.message}`).join('\n');
        const prompt = `Analyze this practice conversation and provide constructive feedback on communication style, engagement level, and suggestions for improvement:\n\n${conversation}`;
        const feedback = await getAIResponse(prompt, userProfile, 'general');
        setSessionFeedback(feedback);
        setShowFeedback(true);
      } catch (error) {
        console.error('Error getting feedback:', error);
      }
    }
    setPracticePartnerActive(false);
    setPracticeMessages([]);
  };

  const startPracticePartner = () => {
    setPracticePartnerActive(true);
    setShowPracticeInput(true);
    setPracticeMessages([]);
    
    // Set scenario text based on selection
    const scenarioTexts = {
      first_date: "You're on a first date at a cozy coffee shop. The conversation has been flowing well, and you want to keep it engaging.",
      relationship_talk: "You're having a deeper conversation with your partner about your relationship and future together.",
      casual_chat: "You're texting with someone you've been talking to for a few weeks. Keep it light and fun.",
      conflict_resolution: "You need to address a misunderstanding with your partner in a constructive way."
    };
    
    setCurrentScenarioText(scenarioTexts[practiceScenario as keyof typeof scenarioTexts]);
  };

  if (activeSection === 'starters') {
    return (
      <div className="space-y-6">
        <ConversationStartersSection 
          userProfile={userProfile}
          conversationStarters={conversationStarters}
          handleShare={handleShare}
        />
      </div>
    );
  }

  if (activeSection === 'practice') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Practice Partner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!practicePartnerActive ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="scenario">Choose Practice Scenario</Label>
                  <Select value={practiceScenario} onValueChange={setPracticeScenario}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_date">First Date</SelectItem>
                      <SelectItem value="relationship_talk">Relationship Discussion</SelectItem>
                      <SelectItem value="casual_chat">Casual Texting</SelectItem>
                      <SelectItem value="conflict_resolution">Conflict Resolution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={startPracticePartner} className="w-full">
                  Start Practice Session
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">{currentScenarioText}</p>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {practiceMessages.map((msg, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground ml-8' 
                        : 'bg-muted mr-8'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))}
                </div>
                
                {showPracticeInput && (
                  <div className="flex gap-2">
                    <Input
                      value={currentPracticeMessage}
                      onChange={(e) => setCurrentPracticeMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyPress={(e) => e.key === 'Enter' && handlePracticeSubmit()}
                    />
                    <Button onClick={handlePracticeSubmit} disabled={isLoading}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                <Button onClick={handleEndSession} variant="outline" className="w-full">
                  End Session & Get Feedback
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Session Feedback</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{sessionFeedback}</p>
              </div>
              <Button onClick={() => setShowFeedback(false)} className="w-full">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (activeSection === 'textgenie') {
    return (
      <div className="space-y-6">
        <TextGenie userProfile={userProfile} />
      </div>
    );
  }

  return null;
};

export default FlirtFuelModule;