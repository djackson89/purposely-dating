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
import TextGenie from '@/components/TextGenie';
import { supabase } from '@/integrations/supabase/client';
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
  const [masterCategory, setMasterCategory] = useState('Date Night');
  const [showCategorySelection, setShowCategorySelection] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Relationship Talk');
  const [customKeywords, setCustomKeywords] = useState('');
  const [currentStarters, setCurrentStarters] = useState<(string | { statement: string; options: { key: string; text: string; }[] })[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCustom, setIsCustom] = useState(false);
  const [customCategories, setCustomCategories] = useState<{[key: string]: (string | { statement: string; options: { key: string; text: string; }[] })[]}>({});
  const [savedPacks, setSavedPacks] = useState<{[key: string]: boolean}>({});
  const [showRename, setShowRename] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [practicePartnerActive, setPracticePartnerActive] = useState(false);
  const [practiceMessages, setPracticeMessages] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([]);
  const [currentPracticeMessage, setCurrentPracticeMessage] = useState('');
  const [practiceScenario, setPracticeScenario] = useState('first_date');
  const [showPracticeInput, setShowPracticeInput] = useState(false);
  const [currentScenarioText, setCurrentScenarioText] = useState('');
  const [sessionFeedback, setSessionFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [depthLevel, setDepthLevel] = useState([1]); // 0=Light, 1=Casual, 2=Deep
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  // State for tracking question transformations
  const [isTransforming, setIsTransforming] = useState(false);
  const [isDepthChanging, setIsDepthChanging] = useState(false);
  const [isLoadingMoreQuestions, setIsLoadingMoreQuestions] = useState(false);
  
  // Optimized cache for pre-loaded questions
  const [questionCache, setQuestionCache] = useState<Map<string, any>>(new Map());
  
  
  const { getFlirtSuggestion, getAIResponse, isLoading } = useRelationshipAI();

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
  
  const conversationStarters = [
    {
      category: "First Date Deep Dive",
      prompts: userProfile.personalityType?.includes("Outgoing") || false 
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
      category: "Date Night Debates",
      masterCategory: "Date Night",
      type: "multiple-choice",
      prompts: [
        {
          statement: "Women who demand 50/50 in relationships but still expect men to pay for dates are hypocrites who want equality only when it benefits them.",
          options: [
            { key: "A", text: "Strongly Agree — Pick a lane and stay in it" },
            { key: "B", text: "Somewhat Agree — You can't have it both ways" },
            { key: "C", text: "Somewhat Disagree — Dating and relationships are different stages" },
            { key: "D", text: "Strongly Disagree — Traditional gestures don't negate modern equality" }
          ]
        },
        {
          statement: "Men who are obsessed with virginity are telling on themselves—they're either terrible in bed or deeply insecure about their past.",
          options: [
            { key: "A", text: "Strongly Agree — The obsession screams inadequacy" },
            { key: "B", text: "Somewhat Agree — It's definitely a red flag mindset" },
            { key: "C", text: "Somewhat Disagree — Some just value different things" },
            { key: "D", text: "Strongly Disagree — People have preferences for valid reasons" }
          ]
        },
        {
          statement: "Any woman still defending cheating men after 30 has daddy issues so severe that therapy can't fix them.",
          options: [
            { key: "A", text: "Strongly Agree — Grown women know better by now" },
            { key: "B", text: "Somewhat Agree — Patterns that deep don't change overnight" },
            { key: "C", text: "Somewhat Disagree — Trauma responses aren't that simple" },
            { key: "D", text: "Strongly Disagree — Y'all love diagnosing women for everything" }
          ]
        },
        {
          statement: "Marriage is just legalized prostitution with a tax break—women trade sex and domestic labor for financial security.",
          options: [
            { key: "A", text: "Strongly Agree — At least escorts are honest about the transaction" },
            { key: "B", text: "Somewhat Agree — Most marriages are economic arrangements disguised as love" },
            { key: "C", text: "Somewhat Disagree — That's a cynical view of genuine partnerships" },
            { key: "D", text: "Strongly Disagree — Love and mutual support aren't transactions" }
          ]
        },
        {
          statement: "Women who constantly post about being 'independent' are usually the most desperate for male validation and financial support.",
          options: [
            { key: "A", text: "Strongly Agree — The loudest ones are always the neediest" },
            { key: "B", text: "Somewhat Agree — Real independence doesn't need constant announcements" },
            { key: "C", text: "Somewhat Disagree — Some are genuinely celebrating their achievements" },
            { key: "D", text: "Strongly Disagree — Y'all can't stand seeing women proud of themselves" }
          ]
        },
        {
          statement: "Men who refuse to eat women out but expect blowjobs are selfish lovers who don't deserve sexual relationships with women.",
          options: [
            { key: "A", text: "Strongly Agree — Reciprocity is basic human decency" },
            { key: "B", text: "Somewhat Agree — Sexual selfishness shows character flaws" },
            { key: "C", text: "Somewhat Disagree — Everyone has boundaries and preferences" },
            { key: "D", text: "Strongly Disagree — Sexual acts shouldn't be mandatory for anyone" }
          ]
        },
        {
          statement: "Most 'traditional women' are just lazy gold diggers who weaponize femininity to avoid adult responsibilities.",
          options: [
            { key: "A", text: "Strongly Agree — It's a hustle disguised as values" },
            { key: "B", text: "Somewhat Agree — Many use it to avoid contributing equally" },
            { key: "C", text: "Somewhat Disagree — Some genuinely prefer traditional roles" },
            { key: "D", text: "Strongly Disagree — Different lifestyles work for different people" }
          ]
        },
        {
          statement: "Men who constantly talk about women being 'ran through' are usually the ones with the most pathetic body counts and sexual insecurities.",
          options: [
            { key: "A", text: "Strongly Agree — It's pure projection and misogyny" },
            { key: "B", text: "Somewhat Agree — Insecure men always police women's sexuality" },
            { key: "C", text: "Somewhat Disagree — Some genuinely care about values alignment" },
            { key: "D", text: "Strongly Disagree — Men can have standards about sexual history" }
          ]
        },
        {
          statement: "Women who stay with cheating men for financial reasons are prostitutes who just don't want to admit it.",
          options: [
            { key: "A", text: "Strongly Agree — If money keeps you there, that's exactly what it is" },
            { key: "B", text: "Somewhat Agree — Financial dependency compromises your dignity" },
            { key: "C", text: "Somewhat Disagree — Complex situations don't deserve harsh judgments" },
            { key: "D", text: "Strongly Disagree — Survival and love can coexist in complex ways" }
          ]
        }
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
    },
    {
      category: "Trust & Transparency",
      masterCategory: "Date Night",
      prompts: [
        "True or False: Complete transparency about daily interactions should be standard in healthy relationships.",
        "True or False: A partner's reluctance to share phone passwords indicates they have something to hide.",
        "True or False: Emotional cheating is more damaging to a relationship than physical infidelity.",
        "True or False: Someone who maintains close friendships with exes lacks respect for relationship boundaries.",
        "True or False: Jealousy is always a sign of personal insecurity rather than legitimate concerns.",
        "True or False: Partners should inform each other about all interactions with people of the opposite sex.",
        "True or False: Checking your partner's social media activity is a violation of privacy, not protection.",
        "True or False: A person's digital behavior when single should have no bearing on relationship expectations.",
        "True or False: Trust once broken can be fully restored with enough time and effort.",
        "True or False: Partners should have complete access to each other's social media accounts.",
        "True or False: Flirting with others is harmless as long as it doesn't lead to anything physical.",
        "True or False: Work relationships that involve late-night communication cross appropriate boundaries.",
        "True or False: A partner who needs constant reassurance is being emotionally manipulative.",
        "True or False: Solo travel or activities without your partner indicates a lack of commitment.",
        "True or False: Relationships require some level of surveillance to maintain trust in the digital age."
      ]
    },
    {
      category: "Intimacy & Connection",
      masterCategory: "Date Night",
      prompts: [
        "How do you differentiate between physical chemistry and deeper emotional intimacy?",
        "What does it mean to you when someone makes you feel emotionally safe during vulnerable moments?",
        "How do you communicate your needs when your desire for intimacy doesn't match your partner's?",
        "What role does emotional foreplay play in your ideal intimate connection?",
        "How do you maintain individual sexual identity while building shared intimacy with a partner?",
        "What's the relationship between emotional vulnerability and physical attraction for you?",
        "How do you navigate mismatched libidos while maintaining connection and avoiding resentment?",
        "What does it look like when someone truly sees and desires all of you, not just your physical self?",
        "How do you balance being sexually adventurous with maintaining emotional safety?",
        "What's the difference between performing for a partner versus authentically sharing yourself?",
        "How do you communicate boundaries around intimacy without creating distance?",
        "What role does anticipation and emotional buildup play in your ideal intimate experiences?"
      ]
    },
    {
      category: "Communication & Conflict",
      masterCategory: "Date Night",
      prompts: [
        "How do you recognize when you're being defensive versus when you're legitimately protecting yourself?",
        "What's the difference between someone who avoids conflict and someone who chooses their battles wisely?",
        "How do you handle conversations when your partner shuts down emotionally?",
        "What does it look like when someone fights fair versus fights to win?",
        "How do you navigate disagreements when you both feel misunderstood?",
        "What's your experience with the difference between being heard and being understood?",
        "How do you address issues when your communication styles are fundamentally different?",
        "What boundaries do you need during heated discussions to feel safe and respected?",
        "How do you know when an argument is productive versus when it's becoming destructive?",
        "What role does timing play in having difficult but necessary conversations?",
        "How do you rebuild connection after a significant disagreement or hurt?",
        "What's the difference between someone who takes accountability and someone who just apologizes?"
      ]
    },
    {
      category: "Red Flags & Green Flags",
      masterCategory: "Date Night",
      prompts: [
        "What's a subtle red flag that most people overlook but you've learned to watch for?",
        "How do you distinguish between someone who's going through a rough patch and someone who has concerning patterns?",
        "What green flag do you value that might not be obvious to others?",
        "What behavior makes you feel instantly safe and valued with someone?",
        "How do you recognize when someone's words don't align with their actions?",
        "What's a warning sign that someone isn't emotionally ready for a relationship?",
        "What does emotional intelligence look like in how someone treats others, not just you?",
        "How do you identify when someone is love-bombing versus genuinely interested?",
        "What's a sign that someone respects your autonomy and doesn't see you as a project?",
        "How do you recognize when someone is building you up versus when they're trying to control your self-image?",
        "What behavior indicates someone sees you as an equal partner rather than a prize to win?",
        "What's the difference between someone who supports your growth and someone who feels threatened by it?"
      ]
    },
    {
      category: "Emotional Intelligence",
      masterCategory: "Date Night",
      prompts: [
        "How do you differentiate between someone having strong boundaries and someone being emotionally unavailable?",
        "What does it look like when someone takes responsibility for their emotional triggers?",
        "How do you handle your own emotional reactions when your partner is processing something difficult?",
        "What's the difference between supporting someone and enabling their unhealthy patterns?",
        "How do you recognize when you're projecting past relationship wounds onto a current situation?",
        "What does healthy interdependence look like to you versus codependency?",
        "How do you maintain your own emotional stability while being present for a partner's struggles?",
        "What's your approach to addressing insecurities without making them your partner's responsibility?",
        "How do you navigate loving someone while accepting they may never change certain things about themselves?",
        "What does it mean to show up authentically in a relationship rather than performing the 'perfect partner'?",
        "How do you balance being understanding with maintaining your own standards and needs?",
        "What's the difference between compromise and losing yourself in a relationship?"
      ]
    },
    {
      category: "Values & Future Vision",
      masterCategory: "Date Night",
      prompts: [
        "How do you navigate when you and a partner have different timelines for relationship milestones?",
        "What does financial compatibility mean beyond just earning similar amounts?",
        "How important is it that a partner shares your spiritual or philosophical worldview?",
        "What role do you want your families to play in your romantic relationship?",
        "How do you handle differences in social energy and need for alone time?",
        "What does equality look like to you in terms of domestic responsibilities and decision-making?",
        "How do you navigate different approaches to handling money, from saving to spending philosophies?",
        "What's your approach to balancing career ambitions with relationship priorities?",
        "How important is it that a partner shares your parenting philosophy if you want children?",
        "What does it mean to grow together as a couple rather than growing apart over time?",
        "How do you handle it when life circumstances change your shared goals or dreams?",
        "What role does adventure and spontaneity play in your ideal long-term partnership?"
      ]
    },
    {
      category: "Self-Awareness & Growth",
      masterCategory: "Date Night",
      prompts: [
        "What insecurities do you recognize as your own responsibility to address rather than your partner's to manage?",
        "How has your understanding of healthy love evolved from your earlier relationships?",
        "What patterns from your family of origin do you actively work to break or continue in your relationships?",
        "How do you balance accepting yourself as you are while still growing and improving?",
        "What's something you've learned about your attachment style and how it shows up in relationships?",
        "How do you distinguish between intuition about a relationship and anxiety or past trauma speaking?",
        "What does self-love look like in practice, and how does it affect your romantic relationships?",
        "How do you handle the vulnerability of being truly known by another person?",
        "What's your relationship with therapy or personal development work?",
        "How do you maintain your individual identity while building a life with someone else?",
        "What does emotional responsibility look like in your relationships?",
        "How do you recognize when you need to focus on personal growth versus when you need relationship support?"
      ]
    },
    
    // Girl's Night Categories
    {
      category: "Pillow Talk & Tea",
      masterCategory: "Girl's Night",
      type: "multiple-choice",
      prompts: [
        {
          statement: "What's your ultimate turn-on during a makeout session?",
          options: [
            { key: "A", text: "Neck kisses" },
            { key: "B", text: "Whispering in my ear" },
            { key: "C", text: "Hands exploring slowly" },
            { key: "D", text: "Being pinned down" }
          ]
        },
        {
          statement: "What's your post-hookup guilty pleasure?",
          options: [
            { key: "A", text: "Stealing his hoodie" },
            { key: "B", text: "Replaying the whole night in my head" },
            { key: "C", text: "Posting a thirst trap" },
            { key: "D", text: "Texting my bestie a full recap" }
          ]
        },
        {
          statement: "Where's your fantasy spot to hook up at least once?",
          options: [
            { key: "A", text: "In a hotel elevator" },
            { key: "B", text: "On the beach at night" },
            { key: "C", text: "Backseat of a car" },
            { key: "D", text: "In his office after hours" }
          ]
        },
        {
          statement: "What makes you feel instantly sexy in the bedroom?",
          options: [
            { key: "A", text: "Wearing lingerie he hasn't seen" },
            { key: "B", text: "When he's obsessed with every inch of me" },
            { key: "C", text: "That first look before things get heated" },
            { key: "D", text: "Knowing I'm the one in control tonight" }
          ]
        },
        {
          statement: "What's your late-night text likely to say?",
          options: [
            { key: "A", text: "U up?" },
            { key: "B", text: "You better not fall asleep on me 😈" },
            { key: "C", text: "Come over. Now." },
            { key: "D", text: "Just a fire selfie with no caption" }
          ]
        },
        {
          statement: "Which roleplay would you secretly love to try?",
          options: [
            { key: "A", text: "Naughty nurse" },
            { key: "B", text: "Strict boss" },
            { key: "C", text: "Mysterious stranger at a bar" },
            { key: "D", text: "Sweet girl with a hidden wild side" }
          ]
        },
        {
          statement: "What's your signature bedroom move?",
          options: [
            { key: "A", text: "Slow teasing until he begs" },
            { key: "B", text: "Eye contact with a smirk" },
            { key: "C", text: "Taking control on top" },
            { key: "D", text: "Whispering exactly what I want" }
          ]
        },
        {
          statement: "What's a confession you've never told your girls?",
          options: [
            { key: "A", text: "I hooked up with someone I wasn't supposed to" },
            { key: "B", text: "I faked it (more than once)" },
            { key: "C", text: "I've had a dream about a friend's man" },
            { key: "D", text: "I filmed myself doing that once" }
          ]
        }
      ]
    },
    {
      category: "Retrograde & Regrets",
      masterCategory: "Girl's Night",
      type: "true-false",
      prompts: [
        "True or False: You always fall hardest when Mercury is in retrograde and you're ghosting a Libra.",
        "True or False: Air signs give the best head but the worst commitment.",
        "True or False: Dating a Scorpio is like signing up for beautiful trauma.",
        "True or False: Earth signs are boring in bed but amazing at building a life.",
        "True or False: Fire signs will have you catching feelings and catching flights.",
        "True or False: Your ex's zodiac sign explains 90% of why y'all didn't work.",
        "True or False: Water signs will drown you in emotions then act surprised when you're suffocating.",
        "True or False: Every time you check your horoscope, it's basically asking your ex back.",
        "True or False: Geminis are just commitment-phobic Virgos who haven't found their person yet.",
        "True or False: Leo season makes everyone think they deserve better than they do."
      ]
    },
    {
      category: "Vulnerable & Valid",
      masterCategory: "Girl's Night",
      prompts: [
        "What's one way you've outgrown the version of yourself who accepted the bare minimum in love?",
        "How has healing your relationship with your father changed what you look for in men?",
        "What's a fear about love that you're still working through with your therapist?",
        "When did you realize that being alone was better than being with the wrong person?",
        "What's something you need to forgive yourself for in your past relationships?",
        "How do you show yourself the love you wish you'd received growing up?",
        "What's a boundary you had to set that felt mean but was necessary for your peace?",
        "What's the most healing thing someone has ever said to you about your worth?",
        "How do you know when someone is safe enough to share your triggers with?",
        "What does unconditional self-love look like when you're having an off day?",
        "What's a toxic pattern you inherited that you're determined not to pass on?",
        "How has your definition of emotional safety evolved as you've gotten older?"
      ]
    },
    {
      category: "Hot Mess Express",
      masterCategory: "Girl's Night",
      type: "would-you-rather",
      prompts: [
        "Would you rather: Catch feelings for your sneaky link OR get back with your toxic ex during cuffing season?",
        "Would you rather: Send a thirst trap to your ex by accident OR have your mom find your dating app?",
        "Would you rather: Date someone with an ugly car OR someone with an ugly laugh?",
        "Would you rather: Be the side chick to someone rich OR the main girl to someone broke?",
        "Would you rather: Have amazing sex with bad conversation OR amazing conversation with bad sex?",
        "Would you rather: Accidentally like your ex's new girl's photo OR have her slide into your DMs asking about him?",
        "Would you rather: Date someone your friends hate OR someone your family loves but you're not attracted to?",
        "Would you rather: Get caught stalking his social media OR have him catch you talking about him to your girls?",
        "Would you rather: Date someone with daddy issues OR someone with mommy issues?",
        "Would you rather: Be single for 5 years OR settle for someone who's 'fine' for the rest of your life?"
      ]
    }
  ];


  // Optimized question depth adjustment with smart caching
  const adjustQuestionDepth = React.useCallback(async (originalQuestion: string, depth: number): Promise<string> => {
    const cacheKey = `${originalQuestion}_${depth}`;
    
    // Check cache first
    if (questionCache.has(cacheKey)) {
      return questionCache.get(cacheKey);
    }

    try {
      const depthInstructions = {
        0: "Make this witty and sarcastic (80 chars max). ONLY return the question.",
        1: "Make this balanced and engaging (80 chars max). ONLY return the question.", 
        2: "Make this deep and psychological (80 chars max). ONLY return the question."
      };

      const prompt = `Transform: "${originalQuestion}"\n\n${depthInstructions[depth as keyof typeof depthInstructions]}`;
      
      const response = await getAIResponse(prompt, userProfile, 'general');
      
      // Ultra-fast cleaning
      const result = response.trim().replace(/^["']|["']$/g, '').split('\n')[0].substring(0, 120);
      
      // Cache the result
      questionCache.set(cacheKey, result);
      
      return result || originalQuestion;
      
    } catch (error) {
      console.error('Error adjusting question depth:', error);
      return originalQuestion;
    }
  }, [questionCache, userProfile, getAIResponse]);

  // Function to adjust multiple-choice questions for depth
  const adjustMultipleChoiceDepth = React.useCallback(async (originalQuestion: { statement: string; options: { key: string; text: string; }[] }, depth: number): Promise<{ statement: string; options: { key: string; text: string; }[] }> => {
    const cacheKey = `${originalQuestion.statement}_${depth}_mc`;
    
    // Check cache first
    if (questionCache.has(cacheKey)) {
      return questionCache.get(cacheKey);
    }

    try {
      // For Girl's Night categories, we'll adjust tone based on depth but keep the intimate theme
      const depthInstructions = {
        0: "Make this statement more playful and cheeky, keeping the intimate girl-talk vibe. Adjust the options to be more lighthearted and witty.",
        1: "Keep this statement balanced and engaging with the intimate theme. Make options relatable and fun.",
        2: "Make this statement more bold and provocative while maintaining the girlfriend-to-girlfriend intimacy. Make options more daring and revealing."
      };

      const prompt = `Transform this multiple-choice question for depth level ${depth}: "${originalQuestion.statement}" with options: ${originalQuestion.options.map(opt => `${opt.key}. ${opt.text}`).join(', ')}

${depthInstructions[depth as keyof typeof depthInstructions]}

Format as: Statement? followed by A. [option] B. [option] C. [option] D. [option]`;
      
      const response = await getAIResponse(prompt, userProfile, 'flirt');
      
      // Parse the response
      const lines = response.split('\n').filter(line => line.trim());
      const statementLine = lines.find(line => line.includes('?') && !line.match(/^[A-D]\.?\s*/));
      const statement = statementLine ? statementLine.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').trim() : originalQuestion.statement;
      
      const options = [];
      for (const line of lines) {
        const optionMatch = line.trim().match(/^([A-D])\.?\s*(.+)/);
        if (optionMatch) {
          options.push({
            key: optionMatch[1],
            text: optionMatch[2].replace(/\*\*/g, '').trim()
          });
        }
      }
      
      const result = {
        statement,
        options: options.length >= 4 ? options.slice(0, 4) : originalQuestion.options
      };
      
      // Cache the result
      questionCache.set(cacheKey, result);
      
      return result;
      
    } catch (error) {
      console.error('Error adjusting multiple-choice question depth:', error);
      return originalQuestion;
    }
  }, [questionCache, userProfile, getAIResponse]);

  // Smart initialization with lazy loading
  React.useEffect(() => {
    const initializeQuestions = () => {
      const defaultCategory = conversationStarters.find(cat => cat.category === selectedCategory);
      if (defaultCategory && !isCustom) {
        // Set original questions immediately for instant display
        setCurrentStarters(defaultCategory.prompts);
        
        // Get or set daily question index
        const today = new Date().toDateString();
        const savedQuestionIndex = localStorage.getItem(`dailyQuestionIndex_${selectedCategory}_${today}`);
        
        if (savedQuestionIndex) {
          setCurrentQuestionIndex(parseInt(savedQuestionIndex, 10));
        } else {
          const randomIndex = Math.floor(Math.random() * defaultCategory.prompts.length);
          setCurrentQuestionIndex(randomIndex);
          localStorage.setItem(`dailyQuestionIndex_${selectedCategory}_${today}`, randomIndex.toString());
        }

        // Background preload current depth only (lazy loading)
        if (depthLevel[0] !== 1) { // Only if not default casual level
          setTimeout(() => {
            transformQuestionsForDepth(defaultCategory.prompts, depthLevel[0]);
          }, 100);
        }
      }
    };
    
    initializeQuestions();
  }, [selectedCategory, isCustom]);

  // Optimized depth transformation with minimal calls
  const transformQuestionsForDepth = React.useCallback(async (
    questions: (string | { statement: string; options: { key: string; text: string; }[] })[], 
    depth: number
  ) => {
    if (depth === 1) {
      // Casual is default - no transformation needed
      return questions;
    }

    setIsDepthChanging(true);
    
    try {
      // Process only 3 questions at a time to prevent overload
      const batchSize = 3;
      const transformedQuestions = [...questions]; // Start with originals
      
      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(async (question, batchIndex) => {
            const actualIndex = i + batchIndex;
            
            if (typeof question === 'string') {
              return await adjustQuestionDepth(question, depth);
            } else {
              // For multiple-choice questions in Girl's Night categories, use special handling
              if (selectedCategory === 'Pillow Talk & Tea') {
                return await adjustMultipleChoiceDepth(question, depth);
              } else {
                // For other multiple-choice categories, only adjust the statement
                const transformedStatement = await adjustQuestionDepth(question.statement, depth);
                return {
                  statement: transformedStatement,
                  options: question.options
                };
              }
            }
          })
        );
        
        // Update results in batches for responsive UI
        batchResults.forEach((result, batchIndex) => {
          transformedQuestions[i + batchIndex] = result;
        });
        
        // Update UI progressively
        setCurrentStarters([...transformedQuestions]);
        
        // Small delay to prevent overwhelming the API
        if (i + batchSize < questions.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      return transformedQuestions;
    } catch (error) {
      console.error('Error transforming questions:', error);
      return questions;
    } finally {
      setIsDepthChanging(false);
    }
  }, [adjustQuestionDepth, adjustMultipleChoiceDepth, selectedCategory]);

  // Ultra-fast depth switching with smart fallbacks
  React.useEffect(() => {
    const switchDepth = async () => {
      if (currentStarters.length === 0) return;
      
      let baseQuestions: (string | { statement: string; options: { key: string; text: string; }[] })[];
      
      if (isCustom) {
        baseQuestions = customCategories[selectedCategory] || [];
      } else {
        const defaultCategory = conversationStarters.find(cat => cat.category === selectedCategory);
        baseQuestions = defaultCategory ? defaultCategory.prompts : [];
      }
      
      if (baseQuestions.length === 0) return;
      
      // Transform questions for new depth
      await transformQuestionsForDepth(baseQuestions, depthLevel[0]);
    };
    
    switchDepth();
  }, [depthLevel]);

  // Initialize question pool when category or depth changes
  React.useEffect(() => {
    if (selectedCategory && selectedCategory !== 'Customize' && !isCustom && userProfile) {
      initializeQuestionPool();
    }
  }, [selectedCategory, depthLevel, isCustom, userProfile]);

  // Check for stored section and scenario from Home page navigation or side menu
  React.useEffect(() => {
    const activePracticeSection = localStorage.getItem('activePracticeSection');
    const activeSection = localStorage.getItem('activeSection');
    const storedScenario = localStorage.getItem('practiceScenario');
    
    // Check both storage keys for navigation
    const sectionToActivate = activePracticeSection || activeSection;
    
    if (sectionToActivate) {
      // Set the active section based on the stored value
      switch (sectionToActivate) {
        case 'conversation-starters':
        case 'starters':
          setActiveSection('starters');
          break;
        case 'text-genie':
        case 'textgenie':
          setActiveSection('textgenie');
          break;
        case 'practice':
          setActiveSection('practice');
          if (storedScenario) {
            setCurrentScenarioText(storedScenario);
            setPracticeMessages([{ role: 'ai', message: storedScenario }]);
            setPracticePartnerActive(true);
            setShowPracticeInput(true);
            localStorage.removeItem('practiceScenario');
          }
          break;
      }
      
      // Clear the stored sections after using them
      localStorage.removeItem('activePracticeSection');
      localStorage.removeItem('activeSection');
    }
  }, []);

  const generateCustomStarters = async () => {
    if (!customKeywords.trim()) return;
    
    try {
      const prompt = `Generate 8 emotionally intelligent conversation starter questions based on these keywords: ${customKeywords}. The questions should go beyond surface-level topics and explore relationship boundaries, emotional dynamics, and authentic connection. Make them specific enough that someone thinks "Wow, I never thought to ask that before." Focus on topics that reveal character, values, and emotional maturity while incorporating the mood/themes of the keywords provided.`;
      const aiType = selectedCategory === 'Intimacy' ? 'intimacy' : 'flirt';
      const response = await getAIResponse(prompt, userProfile, aiType);
      
      // Parse the response into an array of questions
      const questions = response.split('\n').filter(line => 
        line.trim() && 
        (line.includes('?') || line.match(/^\d+\.?/))
      ).map(line => 
        line.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').replace(/[""'']/g, "'").replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()
      ).slice(0, 8);
      
      // Generate unique custom category name
      const customIndex = Object.keys(customCategories).length + 1;
      const categoryName = `Custom${customIndex}`;
      
      // Save to custom categories
      setCustomCategories(prev => ({
        ...prev,
        [categoryName]: questions
      }));
      
      setCurrentStarters(questions);
      setCurrentQuestionIndex(0);
      setIsCustom(true);
      setSelectedCategory(categoryName);
      setCustomKeywords(''); // Clear input after generating
    } catch (error) {
      console.error('Error generating custom starters:', error);
    }
  };

  const saveCurrentCustom = () => {
    if (!isCustom || currentStarters.length === 0) return;
    
    const customIndex = Object.keys(customCategories).length + 1;
    const categoryName = `Custom${customIndex}`;
    
    setCustomCategories(prev => ({
      ...prev,
      [categoryName]: currentStarters
    }));
    
    // Mark as saved pack
    setSavedPacks(prev => ({
      ...prev,
      [categoryName]: true
    }));
    
    setSelectedCategory(categoryName);
  };

  const deleteCustomCategory = (categoryName: string) => {
    if (!customCategories[categoryName]) return;
    
    // Remove from custom categories
    setCustomCategories(prev => {
      const newCategories = { ...prev };
      delete newCategories[categoryName];
      return newCategories;
    });
    
    // Remove from saved packs
    setSavedPacks(prev => {
      const newPacks = { ...prev };
      delete newPacks[categoryName];
      return newPacks;
    });
    
    // Reset to default if this was the selected category
    if (selectedCategory === categoryName) {
      setSelectedCategory('Relationship Talk');
      setIsCustom(false);
    }
    
    setShowManage(false);
  };

  const renameCustomCategory = () => {
    if (!newCategoryName.trim() || !isCustom) return;
    
    const oldName = selectedCategory;
    const questions = customCategories[oldName];
    
    if (questions) {
      setCustomCategories(prev => {
        const newCategories = { ...prev };
        delete newCategories[oldName];
        newCategories[newCategoryName.trim()] = questions;
        return newCategories;
      });
      
      // Update saved packs if it was saved
      if (savedPacks[oldName]) {
        setSavedPacks(prev => {
          const newPacks = { ...prev };
          delete newPacks[oldName];
          newPacks[newCategoryName.trim()] = true;
          return newPacks;
        });
      }
      
      setSelectedCategory(newCategoryName.trim());
    }
    
    setShowRename(false);
    setShowManage(false);
    setNewCategoryName('');
  };

  const loadMoreStarters = async () => {
    console.log('Loading more starters...');
    
    // First, try to get a question from the pool for immediate response
    if (!isCustom) {
      try {
        console.log('Attempting to get question from pool...');
        const { data, error } = await supabase.functions.invoke('manage-question-pool', {
          body: { 
            action: 'get_pool_question',
            category: selectedCategory,
            depthLevel: depthLevel[0]
          }
        });

        if (!error && data?.success && data?.question) {
          console.log('Got question from pool:', data.question);
          // Add the pool question to current starters immediately
          setCurrentStarters(prev => [...prev, data.question]);
          setCurrentQuestionIndex(prev => prev + 1);
          
          // Start background refill process
          checkAndRefillPool();
          return;
        }
      } catch (poolError) {
        console.log('Pool unavailable, falling back to AI generation:', poolError);
      }
    }

    if (isCustom && customCategories[selectedCategory]) {
      // Generate more questions for custom category
      const existingQuestions = customCategories[selectedCategory];
      const prompt = `Generate 8 new conversation starter questions similar to these but completely different: ${existingQuestions.join(', ')}`;
      try {
        const aiType = selectedCategory === 'Intimacy' ? 'intimacy' : 'flirt';
        const response = await getAIResponse(prompt, userProfile, aiType);
        const questions = response.split('\n').filter(line => 
          line.trim() && 
          (line.includes('?') || line.match(/^\d+\.?/))
        ).map(line => 
          line.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').replace(/[""'']/g, "'").replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()
        ).slice(0, 8);
        
        if (questions.length > 0) {
          // Apply depth adjustment to custom category questions
          const adjustedQuestions = await Promise.all(
            questions.map(async (question) => {
              if (typeof question === 'string') {
                return await adjustQuestionDepth(question, depthLevel[0]);
              }
              return question; // Keep complex objects as-is
            })
          );
          setCurrentStarters(adjustedQuestions);
          setCurrentQuestionIndex(0);
        }
      } catch (error) {
        console.error('Error loading more starters:', error);
        // Fallback: shuffle the existing questions and apply depth adjustment
        const shuffled = [...customCategories[selectedCategory]].sort(() => Math.random() - 0.5);
        try {
          const adjustedQuestions = await Promise.all(
            shuffled.map(async (question) => {
              if (typeof question === 'string') {
                return await adjustQuestionDepth(question, depthLevel[0]);
              }
              return question; // Keep complex objects as-is
            })
          );
          setCurrentStarters(adjustedQuestions);
        } catch (adjustError) {
          // Ultimate fallback: use original questions
          setCurrentStarters(shuffled);
        }
        setCurrentQuestionIndex(0);
      }
    } else {
      const category = conversationStarters.find(cat => cat.category === selectedCategory);
      if (category) {
        // Enhanced prompt based on category type for deeper, more emotionally intelligent questions
        let prompt = '';
        
        if (selectedCategory === 'Trust & Transparency') {
          prompt = `Generate 8 new "True or False" conversation starter statements that explore trust, transparency, and boundaries in modern relationships. Focus on situations that make people think "I never considered that perspective before." Address topics like digital boundaries, emotional fidelity, communication transparency, and relationship security. Each should start with "True or False:" and be thought-provoking enough to reveal someone's deeper values. Make them different from these examples: ${category.prompts.slice(0, 5).join(', ')}`;
        } else if (selectedCategory === 'Boundaries & Values') {
          prompt = `Generate 8 new conversation starter questions that explore relationship boundaries and values at a deep level. Focus on situations couples actually face but don't often discuss openly - like social media boundaries, opposite-sex friendships, transparency expectations, and personal autonomy within partnerships. Make them specific enough that someone thinks "Wow, I never thought to ask that before." Make them different from these examples: ${category.prompts.slice(0, 5).join(', ')}`;
        } else if (selectedCategory === 'Communication & Conflict') {
          prompt = `Generate 8 new conversation starter questions about emotional intelligence, conflict resolution, and communication patterns in relationships. Focus on the nuanced aspects of how people handle disagreements, express needs, and navigate misunderstandings. Address topics like emotional regulation, defensive patterns, and authentic expression. Make them insightful enough to help someone understand their partner's emotional world better. Make them different from these examples: ${category.prompts.slice(0, 5).join(', ')}`;
        } else if (selectedCategory === 'Red Flags & Green Flags') {
          prompt = `Generate 8 new conversation starter questions that help people identify healthy versus unhealthy relationship patterns. Focus on subtle signs of emotional intelligence, respect, and compatibility that people might overlook. Address topics like emotional availability, authentic interest, and behavioral consistency. Make them reveal character traits that aren't immediately obvious. Make them different from these examples: ${category.prompts.slice(0, 5).join(', ')}`;
        } else if (selectedCategory === 'Emotional Intelligence') {
          prompt = `Generate 8 new conversation starter questions that explore emotional maturity, self-awareness, and psychological health in relationships. Focus on how people handle their own emotions, support others, and navigate complex feelings like jealousy, insecurity, and vulnerability. Address topics like emotional responsibility, trauma awareness, and personal growth. Make them profound enough to spark deep self-reflection. Make them different from these examples: ${category.prompts.slice(0, 5).join(', ')}`;
        } else if (selectedCategory === 'Values & Future Vision') {
          prompt = `Generate 8 new conversation starter questions that explore life values, future compatibility, and shared vision in relationships. Focus on practical aspects of building a life together like financial philosophy, family dynamics, career priorities, and lifestyle preferences. Address topics that reveal fundamental compatibility beyond initial attraction. Make them specific enough to uncover potential areas of conflict or harmony. Make them different from these examples: ${category.prompts.slice(0, 5).join(', ')}`;
        } else if (selectedCategory === 'Self-Awareness & Growth') {
          prompt = `Generate 8 new conversation starter questions that explore personal development, self-awareness, and emotional growth within relationships. Focus on how people understand themselves, work on their issues, and show up authentically in partnerships. Address topics like attachment styles, family patterns, and individual responsibility. Make them introspective enough to promote meaningful self-discovery. Make them different from these examples: ${category.prompts.slice(0, 5).join(', ')}`;
        } else if (selectedCategory === 'Intimacy & Connection') {
          prompt = `Generate 8 new conversation starter questions that explore emotional and physical intimacy in relationships. Focus on the deeper aspects of connection, vulnerability, and authentic sharing between partners. Address topics like emotional safety, sexual communication, and intimate bonding. Make them thoughtful enough to deepen understanding of each other's intimate needs. Make them different from these examples: ${category.prompts.slice(0, 5).join(', ')}`;
        } else if (selectedCategory === 'Pillow Talk & Tea') {
          prompt = `Generate 8 new multiple-choice questions for a "girl's night" conversation game about bedroom confessions, spicy secrets, and flirty topics. Each question should have a statement followed by 4 suggestive, revealing options labeled A, B, C, D. The tone should be fun, intimate, cheeky, bold, and playful - like late-night girl talk with wine in hand. Focus on turn-ons, hookup stories, fantasies, bedroom moves, post-hookup thoughts, and intimate confessions that girlfriends share with each other. Make them slightly provocative but always with a vibe of friendship, laughter, and trust. Format as: "Statement?" with options A. [option] B. [option] C. [option] D. [option]. Make them different from these examples: ${category.prompts.slice(0, 2).map(p => typeof p === 'object' ? p.statement : p).join(', ')}`;
        } else {
          prompt = `Generate 8 new conversation starter questions in the style of "${selectedCategory}" category that go beyond surface-level dating questions. Make them emotionally intelligent, boundary-aware, and specific enough that someone thinks "That's such a good question, I never thought about that." Focus on relationship dynamics, emotional maturity, and authentic connection. They should be similar to these examples but completely different: ${category.prompts.slice(0, 5).join(', ')}. Make them engaging, thought-provoking, and perfect for sparking meaningful conversations about real relationship topics.`;
        }
        
        try {
          const aiType = selectedCategory === 'Intimacy' ? 'intimacy' : 'flirt';
          const response = await getAIResponse(prompt, userProfile, aiType);
          let questions = [];
          
          if (selectedCategory === 'True or False') {
            // Parse True/False statements
            questions = response.split('\n').filter(line => 
              line.trim() && line.toLowerCase().includes('true or false')
            ).map(line => 
              line.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').replace(/[""'']/g, "'").replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()
            ).slice(0, 8);
          } else if (selectedCategory === 'Pillow Talk & Tea') {
            // Parse multiple-choice questions
            const responseLines = response.split('\n').filter(line => line.trim());
            const multipleChoiceQuestions = [];
            
            for (let i = 0; i < responseLines.length; i++) {
              const line = responseLines[i].trim();
              // Look for question statements (lines with ? and not starting with A, B, C, D)
              if (line.includes('?') && !line.match(/^[A-D]\.?\s*/)) {
                const statement = line.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').trim();
                const options = [];
                
                // Look for the next 4 lines for options A, B, C, D
                for (let j = 1; j <= 4 && (i + j) < responseLines.length; j++) {
                  const optionLine = responseLines[i + j].trim();
                  const optionMatch = optionLine.match(/^([A-D])\.?\s*(.+)/);
                  if (optionMatch) {
                    options.push({
                      key: optionMatch[1],
                      text: optionMatch[2].replace(/\*\*/g, '').trim()
                    });
                  }
                }
                
                if (options.length >= 4) {
                  multipleChoiceQuestions.push({
                    statement: statement,
                    options: options.slice(0, 4)
                  });
                  i += 4; // Skip the option lines we just processed
                }
              }
            }
            questions = multipleChoiceQuestions.slice(0, 8);
          } else {
            // Parse regular questions
            questions = response.split('\n').filter(line => 
              line.trim() && 
              (line.includes('?') || line.match(/^\d+\.?/))
            ).map(line => 
              line.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').replace(/[""'']/g, "'").replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()
            ).slice(0, 8);
          }
          
          if (questions.length > 0) {
            // Apply depth transformation to new questions
            try {
              const transformedQuestions = await Promise.all(
                questions.map(async (question) => {
                  if (typeof question === 'string') {
                    return await adjustQuestionDepth(question, depthLevel[0]);
                  } else if (selectedCategory === 'Pillow Talk & Tea') {
                    // Apply depth transformation to multiple-choice questions for Pillow Talk & Tea
                    return await adjustMultipleChoiceDepth(question, depthLevel[0]);
                  } else {
                    return question; // Keep other multiple choice objects as-is
                  }
                })
              );
              setCurrentStarters(transformedQuestions);
            } catch (depthError) {
              console.error('Error applying depth transformation:', depthError);
              setCurrentStarters(questions); // Fallback to untransformed questions
            }
            setCurrentQuestionIndex(0);
          } else {
            throw new Error('No valid questions generated');
          }
        } catch (error) {
          console.error('Error loading more starters:', error);
          // Fallback: shuffle the original questions and apply depth transformation
          const shuffled = [...category.prompts].sort(() => Math.random() - 0.5);
          try {
            const transformedQuestions = await Promise.all(
              shuffled.map(async (question) => {
                if (typeof question === 'string') {
                  return await adjustQuestionDepth(question, depthLevel[0]);
                } else if (selectedCategory === 'Pillow Talk & Tea') {
                  // Apply depth transformation to multiple-choice questions for Pillow Talk & Tea
                  return await adjustMultipleChoiceDepth(question, depthLevel[0]);
                } else {
                  return question; // Keep other multiple choice objects as-is
                }
              })
            );
            setCurrentStarters(transformedQuestions);
          } catch (depthError) {
            console.error('Error applying depth transformation to fallback:', depthError);
            setCurrentStarters(shuffled); // Ultimate fallback
          }
          setCurrentQuestionIndex(0);
        }
      }
    }
  };

  // Helper function to check pool count and refill if needed
  const checkAndRefillPool = async () => {
    try {
      console.log('Checking pool count...');
      const { data, error } = await supabase.functions.invoke('manage-question-pool', {
        body: { 
          action: 'check_pool_count',
          category: selectedCategory,
          depthLevel: depthLevel[0]
        }
      });

      if (!error && data?.success && data?.needsRefresh) {
        console.log(`Pool needs refresh, only ${data.count} questions left`);
        // Start background generation
        refillQuestionPool();
      }
    } catch (error) {
      console.error('Error checking pool count:', error);
    }
  };

  // Helper function to refill the question pool in background
  const refillQuestionPool = async () => {
    try {
      console.log('Refilling question pool in background...');
      await supabase.functions.invoke('manage-question-pool', {
        body: { 
          action: 'populate_pool',
          userProfile,
          category: selectedCategory,
          depthLevel: depthLevel[0],
          questionsToGenerate: 20
        }
      });
      console.log('Pool refill complete');
    } catch (error) {
      console.error('Error refilling pool:', error);
    }
  };

  // Function to initialize the question pool when app starts
  const initializeQuestionPool = async () => {
    if (isCustom) return; // Don't initialize pool for custom categories
    
    try {
      console.log('Initializing question pool...');
      const { data, error } = await supabase.functions.invoke('manage-question-pool', {
        body: { 
          action: 'check_pool_count',
          category: selectedCategory,
          depthLevel: depthLevel[0]
        }
      });

      if (!error && data?.success && data.count === 0) {
        console.log('Pool is empty, populating...');
        await refillQuestionPool();
      }
    } catch (error) {
      console.error('Error initializing pool:', error);
    }
  };

  const selectCategory = (categoryName: string) => {
    if (categoryName === 'Customize') {
      // Set to custom mode and clear current starters
      setSelectedCategory('Customize');
      setIsCustom(false); // Reset custom flag
      setCurrentStarters([]); // Clear current starters to show customize interface
      setCustomKeywords('');
      setShowCategorySelection(true); // Stay on category selection for customize
      return;
    }
    
    setSelectedCategory(categoryName);
    
    // Check if it's a custom category
    if (customCategories[categoryName]) {
      setIsCustom(true);
      // Apply depth adjustment to custom category questions
      const applyDepthToCustomCategory = async () => {
        try {
          const adjustedQuestions = await Promise.all(
            customCategories[categoryName].map(async (question) => {
              if (typeof question === 'string') {
                return await adjustQuestionDepth(question, depthLevel[0]);
              }
              return question; // Keep complex objects as-is
            })
          );
          setCurrentStarters(adjustedQuestions);
        } catch (error) {
          console.error('Error adjusting custom category depth:', error);
          setCurrentStarters(customCategories[categoryName]); // Fallback to original
        }
      };
      applyDepthToCustomCategory();
      setCurrentQuestionIndex(0);
      setShowCategorySelection(false); // Move to question display
    } else {
      setIsCustom(false);
      const category = conversationStarters.find(cat => cat.category === categoryName);
      if (category) {
        // Apply depth transformation to regular category questions
        const applyDepthToCategory = async () => {
          try {
            const transformedQuestions = await Promise.all(
              category.prompts.map(async (question) => {
                if (typeof question === 'string') {
                  return await adjustQuestionDepth(question, depthLevel[0]);
                }
                return question; // Keep multiple choice objects as-is
              })
            );
            setCurrentStarters(transformedQuestions);
          } catch (error) {
            console.error('Error adjusting category depth:', error);
            setCurrentStarters(category.prompts); // Fallback to original
          }
        };
        applyDepthToCategory();
        setCurrentQuestionIndex(0);
        setShowCategorySelection(false); // Move to question display
      }
    }
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex < currentStarters.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // When reaching the end, always load more questions for smooth experience
      setIsLoadingMoreQuestions(true);
      try {
        await loadMoreStarters();
      } finally {
        setIsLoadingMoreQuestions(false);
      }
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleCardSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      nextQuestion();
    } else {
      previousQuestion();
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
        // Swiped left - next question
        nextQuestion();
      } else {
        // Swiped right - previous question
        previousQuestion();
      }
    }
  };

  const openFullScreen = () => {
    setIsFullScreen(true);
  };

  const closeFullScreen = () => {
    setIsFullScreen(false);
  };

  // AI Practice Partner methods
  const practiceScenarios = [
    { id: 'first_date', name: 'First Date', description: 'Practice conversation for a first date scenario' },
    { id: 'relationship_talk', name: 'Relationship Talk', description: 'Practice discussing relationship topics' },
    { id: 'conflict_resolution', name: 'Conflict Resolution', description: 'Practice handling disagreements constructively' },
    { id: 'flirting', name: 'Flirting', description: 'Practice playful and romantic conversation' },
    { id: 'vulnerable_sharing', name: 'Vulnerable Sharing', description: 'Practice sharing deeper feelings and thoughts' }
  ];

  const generateScenario = async (scenarioType: string) => {
    const scenarioTemplates = {
      first_date: [
        "Hi! Let's practice first date conversation. The scenario is that we just sat down at a cozy coffee shop for our first date. You seem a bit nervous, which is endearing. I smile warmly and say, 'I'm so glad we finally got to meet in person! How has your day been so far?'",
        "Hi! Let's practice first date conversation. The scenario is that we're walking through a park after dinner on our first date. There's a comfortable silence, and then I point to a street musician and say, 'Oh, I love this song! Do you have any musicians or artists you're really into lately?'",
        "Hi! Let's practice first date conversation. We're at a bookstore café for our first date, and I notice you looking at the book section. I approach with our drinks and say, 'I see you eyeing those books! Are you much of a reader? I'd love to know what kind of stories you're drawn to.'"
      ],
      relationship_talk: [
        "Hi! Let's practice relationship conversation. The scenario is that we've been dating for a few months, and we're having a quiet evening at home. I look over at you while we're watching TV and say, 'I've been thinking... I really appreciate how you always make me laugh when I'm stressed. What's something I do that you appreciate?'",
        "Hi! Let's practice relationship conversation. We're lying in bed on a Sunday morning, and I turn to you with a thoughtful expression and say, 'I feel like we have such good chemistry. What do you think makes us work so well together?'",
        "Hi! Let's practice relationship conversation. We're cooking dinner together and I pause, looking at you with a smile, and say, 'You know, I feel really comfortable with you. Is there anything you'd like us to talk about more or do differently together?'"
      ],
      conflict_resolution: [
        "Hi! Let's practice conflict resolution. The scenario is that I said something that deeply offended you a week ago, but it's still on your mind. You feel resentful towards me but I'm pretending everything is normal which makes you feel even more upset. I just got home and asked you, 'Something seems off about you. You okay?'",
        "Hi! Let's practice conflict resolution. We had plans to spend the weekend together, but I canceled last minute to hang out with friends instead. You felt like I prioritized them over you. Now it's Monday evening and there's tension between us. I finally bring it up: 'I feel like you've been distant since the weekend. Can we talk about what's going on?'",
        "Hi! Let's practice conflict resolution. We've been disagreeing about how much time we spend together - you want more quality time, but I've been saying I need more space. It's created tension for weeks. I sit down next to you and say, 'I know we've been going in circles about this. Help me understand what you're really feeling.'"
      ],
      flirting: [
        "Hi! Let's practice flirting. The scenario is that we're at a party and have been chatting and laughing all evening. We're in a quieter corner now, and I lean in closer with a playful smile and say, 'I have to admit, you're much more charming than I expected. Are you always this good at making conversation?'",
        "Hi! Let's practice flirting. We're on our third date, walking along the beach at sunset. I stop walking and turn to face you with a mischievous grin and say, 'You know, I keep finding myself thinking about you when we're apart. Should I be worried about that?'",
        "Hi! Let's practice flirting. We're cooking together in your kitchen, and I keep catching you looking at me. I brush past you to reach for something, then turn around with a teasing smile and say, 'You seem distracted. Is the cooking really that interesting, or is it something else?'"
      ],
      vulnerable_sharing: [
        "Hi! Let's practice vulnerable conversation. The scenario is that we've been dating for a while and are getting more serious. We're cuddled up on the couch, and I take a deep breath and say, 'I want to share something with you that I don't usually talk about. I sometimes struggle with anxiety, especially in relationships. I wanted you to know because I trust you.'",
        "Hi! Let's practice vulnerable conversation. We're having a deep late-night conversation, and I look at you with uncertainty and say, 'Can I tell you something that scares me? I'm really starting to fall for you, and that terrifies me because I've been hurt before. How are you feeling about us?'",
        "Hi! Let's practice vulnerable conversation. We're walking together after a difficult family dinner I invited you to. I stop and say, 'I'm sorry if tonight was awkward. My family can be... complicated. I wanted you to see that part of my life, but I'm worried about what you think now.'"
      ]
    };

    const templates = scenarioTemplates[scenarioType as keyof typeof scenarioTemplates] || scenarioTemplates.first_date;
    
    // Get or set daily scenario index for this scenario type
    const today = new Date().toDateString();
    const savedScenarioIndex = localStorage.getItem(`dailyScenarioIndex_${scenarioType}_${today}`);
    
    let scenarioIndex;
    if (savedScenarioIndex) {
      scenarioIndex = parseInt(savedScenarioIndex, 10);
    } else {
      // Generate new daily scenario index
      scenarioIndex = Math.floor(Math.random() * templates.length);
      localStorage.setItem(`dailyScenarioIndex_${scenarioType}_${today}`, scenarioIndex.toString());
    }
    
    return templates[scenarioIndex];
  };

  const startPracticeSession = async () => {
    setPracticePartnerActive(true);
    setPracticeMessages([]);
    setShowPracticeInput(false);
    
    try {
      const scenarioText = await generateScenario(practiceScenario);
      setCurrentScenarioText(scenarioText);
      setPracticeMessages([{ role: 'ai', message: scenarioText }]);
    } catch (error) {
      console.error('Error generating scenario:', error);
      const fallbackMessage = "Hi! I'm your AI practice partner. Let's practice some conversation skills together!";
      setCurrentScenarioText(fallbackMessage);
      setPracticeMessages([{ role: 'ai', message: fallbackMessage }]);
    }
  };

  const tryDifferentScenario = async () => {
    setShowPracticeInput(false);
    try {
      // Force generate a new random scenario by clearing the daily storage
      const today = new Date().toDateString();
      localStorage.removeItem(`dailyScenarioIndex_${practiceScenario}_${today}`);
      
      const scenarioText = await generateScenario(practiceScenario);
      setCurrentScenarioText(scenarioText);
      setPracticeMessages([{ role: 'ai', message: scenarioText }]);
    } catch (error) {
      console.error('Error generating new scenario:', error);
    }
  };

  const handleReplyToScenario = () => {
    setShowPracticeInput(true);
  };

  const sendPracticeMessage = async () => {
    if (!currentPracticeMessage.trim()) return;
    
    const userMessage = currentPracticeMessage.trim();
    const updatedMessages = [...practiceMessages, { role: 'user' as const, message: userMessage }];
    setPracticeMessages(updatedMessages);
    setCurrentPracticeMessage('');
    
    try {
      const scenario = practiceScenarios.find(s => s.id === practiceScenario);
      const conversationHistory = updatedMessages.map(m => 
        `${m.role === 'user' ? 'User' : 'Practice Partner'}: ${m.message}`
      ).join('\n');
      
      const prompt = `You are an AI practice partner helping someone improve their dating conversation skills. You're roleplaying as a potential romantic partner in a ${scenario?.name.toLowerCase()} scenario.

Context: ${scenario?.description}
User Profile: Love Language: ${userProfile.loveLanguage}, Personality: ${userProfile.personalityType}

Conversation so far:
${conversationHistory}

Respond naturally as someone they might be dating. Be engaging, realistic, and provide subtle feedback through your responses. Keep responses conversational and authentic. If they say something particularly good or something that needs improvement, respond naturally as a real person would.`;

      const response = await getFlirtSuggestion(prompt, userProfile);
      setPracticeMessages(prev => [...prev, { role: 'ai', message: response }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setPracticeMessages(prev => [...prev, { role: 'ai', message: "Sorry, I'm having trouble responding right now. Let's try again!" }]);
    }
  };

  const generateSessionFeedback = async () => {
    if (practiceMessages.length <= 1) return "Not enough conversation to provide feedback.";

    const scenario = practiceScenarios.find(s => s.id === practiceScenario);
    const conversationHistory = practiceMessages.map(m => 
      `${m.role === 'user' ? 'User' : 'Practice Partner'}: ${m.message}`
    ).join('\n');

    // Category-specific feedback prompts
    const feedbackPrompts = {
      first_date: `Analyze this first date practice conversation and provide encouraging but constructive feedback. Focus on: conversation flow, showing genuine interest, asking engaging follow-up questions, being authentic while staying engaging, and creating comfort. Highlight what they did well and offer 2-3 specific tips for future first dates.`,
      
      relationship_talk: `Analyze this relationship conversation practice and provide thoughtful feedback. Focus on: emotional intelligence, vulnerability, active listening, expressing appreciation, and healthy communication patterns. Acknowledge their strengths and provide 2-3 specific suggestions for deeper relationship conversations.`,
      
      conflict_resolution: `Analyze this conflict resolution practice conversation and provide constructive feedback. Focus on: staying calm under pressure, using "I" statements vs. "you" accusations, finding middle ground without compromising core boundaries, de-escalation techniques, and showing empathy while standing firm. Highlight what they did well and offer 2-3 specific strategies for handling future conflicts more effectively.`,
      
      flirting: `Analyze this flirting practice conversation and provide playful yet helpful feedback. Focus on: playfulness and light-heartedness, building romantic tension, confidence without being pushy, humor and charm, and creating intrigue. Celebrate what they did well and offer 2-3 specific tips to be more fun, engaging, and naturally seductive in future interactions.`,
      
      vulnerable_sharing: `Analyze this vulnerable sharing practice conversation and provide supportive feedback. Focus on: emotional openness, appropriate pacing of vulnerability, creating safe space for deep connection, authenticity, and reciprocal sharing. Acknowledge their courage and provide 2-3 specific suggestions for sharing more effectively in intimate conversations.`
    };

    const scenarioPrompt = feedbackPrompts[practiceScenario as keyof typeof feedbackPrompts] || feedbackPrompts.first_date;

    const prompt = `You are a dating and relationship coach providing personalized feedback after a practice conversation session.

Scenario Type: ${scenario?.name}
User Profile: Love Language: ${userProfile.loveLanguage}, Personality: ${userProfile.personalityType}

Conversation:
${conversationHistory}

${scenarioPrompt}

Format your feedback as:
1. Start with genuine encouragement about what they did well
2. Provide 2-3 specific, actionable improvements
3. End with motivation for their next real-world interaction

Keep it warm, supportive, but specific enough to be genuinely helpful. Avoid generic advice - make it personal to their conversation.`;

    try {
      const feedback = await getFlirtSuggestion(prompt, userProfile);
      return feedback;
    } catch (error) {
      console.error('Error generating feedback:', error);
      return "Great job practicing! Keep working on your conversation skills - every interaction is a chance to improve.";
    }
  };

  const endPracticeSession = async () => {
    // Generate feedback before ending the session
    setShowFeedback(false);
    setSessionFeedback('');
    
    if (practiceMessages.length > 1) {
      try {
        const feedback = await generateSessionFeedback();
        setSessionFeedback(feedback);
        setShowFeedback(true);
      } catch (error) {
        console.error('Error generating session feedback:', error);
      }
    }
    
    setPracticePartnerActive(false);
    setPracticeMessages([]);
    setCurrentPracticeMessage('');
    setShowPracticeInput(false);
  };

  const sections = [
    { id: 'starters', label: 'Conversation Starters', icon: MessageCircle },
    { id: 'textgenie', label: 'Text Genie', icon: Wand2 },
    { id: 'practice', label: 'AI Practice', icon: Zap }
  ];

  return (
    <div className="pb-20 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
          Clarity Coach ✨
        </h1>
        <p className="text-muted-foreground">No more second-guessing—just powerful connection</p>
      </div>

      {/* Section Tabs - Icons Only */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              variant={activeSection === section.id ? "romance" : "soft"}
              size="sm"
              className="flex items-center justify-center p-3 h-12 w-full"
              title={section.label}
            >
              <IconComponent className="w-5 h-5" />
            </Button>
          );
        })}
      </div>


      {/* Conversation Starters */}
      {activeSection === 'starters' && (
        <ConversationStartersSection
          userProfile={userProfile}
          conversationStarters={conversationStarters}
          masterCategory={masterCategory}
          selectedCategory={selectedCategory}
          customKeywords={customKeywords}
          currentStarters={currentStarters}
          currentQuestionIndex={currentQuestionIndex}
          isCustom={isCustom}
          customCategories={customCategories}
          savedPacks={savedPacks}
          showRename={showRename}
          showManage={showManage}
          newCategoryName={newCategoryName}
          depthLevel={depthLevel}
          isLoading={isLoading || isDepthChanging}
          isFullScreen={isFullScreen}
          touchStart={touchStart}
          touchEnd={touchEnd}
          showCategorySelection={showCategorySelection}
          setMasterCategory={setMasterCategory}
          setShowCategorySelection={setShowCategorySelection}
          setSelectedCategory={setSelectedCategory}
          setCustomKeywords={setCustomKeywords}
          setCurrentQuestionIndex={setCurrentQuestionIndex}
          setShowRename={setShowRename}
          setShowManage={setShowManage}
          setNewCategoryName={setNewCategoryName}
          setDepthLevel={setDepthLevel}
          setTouchStart={setTouchStart}
          setTouchEnd={setTouchEnd}
          selectCategory={selectCategory}
          generateCustomStarters={generateCustomStarters}
          saveCurrentCustom={saveCurrentCustom}
          deleteCustomCategory={deleteCustomCategory}
          renameCustomCategory={renameCustomCategory}
          previousQuestion={previousQuestion}
          nextQuestion={nextQuestion}
          openFullScreen={openFullScreen}
          handleTouchStart={handleTouchStart}
          handleTouchEnd={handleTouchEnd}
          handleShare={handleShare}
          isMultipleChoice={isMultipleChoice}
          getQuestionText={getQuestionText}
        />
      )}


      {/* Text Genie */}
      {activeSection === 'textgenie' && (
        <div className="animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <h2 className="text-xl font-semibold text-primary">Text Genie</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <InfoDialog
                title="Text Genie"
                description="Get AI-powered help crafting the perfect text message replies. Share context through text, photos, or voice recordings, and receive personalized response suggestions with different tones and explanations."
              />
            </div>
          </div>
          <TextGenie userProfile={userProfile} />
        </div>
      )}

      {/* AI Practice */}
      {activeSection === 'practice' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">AI Practice</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <InfoDialog
                title="AI Practice"
                description="Practice conversations with AI partners in a safe, judgment-free space. Build confidence and improve your communication skills before real dates."
              />
            </div>
          </div>
        {!practicePartnerActive ? (
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>AI Practice Partner</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="scenario-select" className="text-sm font-medium">Choose Practice Scenario:</Label>
                <Select value={practiceScenario} onValueChange={setPracticeScenario}>
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder="Select a scenario" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-lg">
                    {practiceScenarios.map((scenario) => (
                      <SelectItem 
                        key={scenario.id} 
                        value={scenario.id}
                        className="bg-card hover:bg-muted cursor-pointer"
                      >
                        {scenario.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {practiceScenarios.find(s => s.id === practiceScenario)?.description}
                </p>
              </div>
              
              <Button 
                onClick={startPracticeSession}
                disabled={isLoading}
                variant="romance" 
                className="w-full"
              >
                {isLoading ? 'Starting...' : 'Start Practice Session ✨'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-romance border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>Practice Session</span>
              </CardTitle>
              <Button 
                onClick={endPracticeSession}
                variant="outline"
                size="sm"
              >
                End Session
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chat Messages */}
              <div className="space-y-3 max-h-96 overflow-y-auto p-4 bg-muted/20 rounded-lg border">
                {practiceMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border'
                      }`}
                    >
                      <p className="text-lg">{message.message}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">Practice partner is typing...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Initial Scenario Buttons */}
              {!showPracticeInput && practiceMessages.length === 1 && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleReplyToScenario}
                      variant="romance"
                      className="flex-1"
                    >
                      Reply
                    </Button>
                    <Button
                      onClick={tryDifferentScenario}
                      disabled={isLoading}
                      variant="outline"
                      className="flex-1"
                    >
                      {isLoading ? 'Loading...' : 'Try a Different Scenario'}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Message Input - Only show after Reply is clicked or during conversation */}
              {showPracticeInput && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={currentPracticeMessage}
                      onChange={(e) => setCurrentPracticeMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendPracticeMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={sendPracticeMessage}
                      disabled={isLoading || !currentPracticeMessage.trim()}
                      variant="romance"
                      className="h-auto self-end"
                    >
                      Send
                    </Button>
                  </div>
                  
                  {/* Persistent Try Another Scenario Button */}
                  <Button
                    onClick={tryDifferentScenario}
                    disabled={isLoading}
                    variant="soft"
                    size="sm"
                    className="w-full"
                  >
                    {isLoading ? 'Loading...' : 'Try Another Scenario'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Session Feedback Modal */}
        {showFeedback && sessionFeedback && (
          <Card className="shadow-romance border-primary/20 bg-gradient-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HeartIcon className="w-5 h-5 text-primary animate-heart-pulse" size={20} />
                <span>Practice Session Feedback</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/20 rounded-lg border">
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{sessionFeedback}</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowFeedback(false);
                    setSessionFeedback('');
                  }}
                  variant="romance"
                  className="flex-1"
                >
                  Got it! ✨
                </Button>
                <Button
                  onClick={startPracticeSession}
                  variant="outline"
                  className="flex-1"
                >
                  Practice Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      )}

      {/* Full Screen Question Modal */}
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-full max-h-full w-screen h-screen m-0 p-0 rounded-none border-none bg-gradient-romance [&>button]:hidden">
          <div className="relative h-full flex flex-col">
            {/* Close button */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                onClick={closeFullScreen}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-full w-10 h-10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>


            {/* Main content area - enlarged to take up 50%+ of screen */}
            <div 
              className="flex-1 flex items-center justify-center px-4 py-16 select-none cursor-pointer"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="text-center w-full max-w-6xl mx-auto">
                {/* Category with emoji */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <span className="text-3xl">
                      {(() => {
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
                          "Relationship Talk": "💭",
                          "Intimacy": "💗",
                          "Customize": "⚙️"
                        };
                        return categoryEmojis[selectedCategory] || "💭";
                      })()}
                    </span>
                    <h2 className="text-lg sm:text-xl font-medium text-white/90">{selectedCategory}</h2>
                  </div>
                </div>

                {/* Single gradient background for both question and answers */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60 rounded-2xl backdrop-blur-sm"></div>
                  <div className="relative px-6 py-6">
                    {isMultipleChoice(currentStarters[currentQuestionIndex]) ? (
                      <div className="w-full">
                        {/* Question */}
                        <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-8">
                          {currentStarters[currentQuestionIndex].statement}
                        </p>
                        
                        {/* Answer choices */}
                        <div className="space-y-4 sm:space-y-6 text-left max-w-5xl mx-auto">
                          {currentStarters[currentQuestionIndex].options.map((option) => (
                            <div key={option.key} className="text-white/90">
                              <span className="font-bold text-xl sm:text-2xl md:text-3xl mr-4">{option.key}.</span>
                              <span className="text-lg sm:text-xl md:text-2xl leading-relaxed break-words">
                                {option.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      // Single question with line break support for formatted text
                      <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white leading-tight max-w-5xl mx-auto">
                        {getQuestionText(currentStarters[currentQuestionIndex])?.replace(/\*\*/g, '').replace(/[""'']/g, '').replace(/[^\w\s\?\.\!\,\:\;\(\)\-']/g, '').trim().split('\n').map((line, index) => (
                          <div key={index} className={
                            index === 0 ? "mb-6" : 
                            line.match(/^[A-D]\.\s/) ? "text-left text-lg sm:text-xl md:text-2xl font-bold mb-3 max-w-4xl mx-auto" : 
                            "text-left text-xl sm:text-2xl md:text-3xl mb-2 max-w-4xl mx-auto"
                          }>
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Share button at bottom */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
              <Button
                onClick={() => handleShare(getQuestionText(currentStarters[currentQuestionIndex]))}
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/20 rounded-full px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <Send className="w-5 h-5 mr-2" />
                Ask a friend
              </Button>
            </div>

            {/* Navigation indicators - moved up to make room for share button */}
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-3">
                {currentStarters.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-colors cursor-pointer ${
                      index === currentQuestionIndex 
                        ? 'bg-white' 
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                    onClick={() => setCurrentQuestionIndex(index)}
                  />
                ))}
              </div>
            </div>

            {/* Swipe instructions with functional arrows */}
            <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-3 text-white/70 text-sm">
                <Button
                  onClick={previousQuestion}
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/20 rounded-full w-8 h-8 p-0 transition-all"
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span>Swipe</span>
                <Button
                  onClick={nextQuestion}
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/20 rounded-full w-8 h-8 p-0 transition-all"
                  disabled={isLoadingMoreQuestions}
                >
                  {isLoadingMoreQuestions ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlirtFuelModule;