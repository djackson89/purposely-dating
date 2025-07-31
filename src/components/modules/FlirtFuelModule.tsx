import React, { useState, useCallback, useMemo, useRef } from 'react';
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

// Optimized conversation starters data - memoized outside component to prevent recreation
const conversationStartersData = [
  {
    category: "First Date Deep Dive",
    prompts: [
      "What belief you held strongly in your twenties has completely shifted as you've grown?",
      "What's something you're working on healing within yourself right now?",
      "How do you know when someone truly sees and appreciates the real you?",
      "What pattern do you notice in the type of people you're drawn to?",
      "What does emotional maturity look like to you in a relationship?",
      "What's a conversation topic that instantly reveals someone's character to you?"
    ]
  },
  {
    category: "Relationship Clarity",
    masterCategory: "Date Night", 
    prompts: [
      "Since your love language is {loveLanguage}, how do you communicate when you're not feeling loved in that way?",
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
      "What does self-love look like in practice, and how does it affect your romantic relationships?",
      "How do you handle the vulnerability of being truly known by another person?",
      "What's your relationship with therapy or personal development work?",
      "How do you maintain your individual identity while building a life with someone else?",
      "What does emotional responsibility look like in your relationships?",
      "How do you recognize when you need to focus on personal growth versus when you need relationship support?"
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
          { key: "D", text: "Strongly Disagree — Survival and sex work aren't the same thing" }
        ]
      },
      {
        statement: "Any man who makes his girlfriend split the bill while he's driving her car and sleeping in her bed is a certified loser who should be immediately dumped.",
        options: [
          { key: "A", text: "Strongly Agree — That's hobosexual behavior at its finest" },
          { key: "B", text: "Somewhat Agree — At minimum, contribute something substantial" },
          { key: "C", text: "Somewhat Disagree — Relationships aren't always about who pays more" },
          { key: "D", text: "Strongly Disagree — Love shouldn't be measured by financial contributions" }
        ]
      },
      {
        statement: "Most polyamorous people are just commitment-phobic narcissists who dress up their inability to love one person as enlightenment.",
        options: [
          { key: "A", text: "Strongly Agree — It's emotional immaturity with fancy packaging" },
          { key: "B", text: "Somewhat Agree — Most use it to avoid deep emotional work" },
          { key: "C", text: "Somewhat Disagree — Some genuinely function better in multiple relationships" },
          { key: "D", text: "Strongly Disagree — Different relationship styles work for different people" }
        ]
      },
      {
        statement: "Women who say 'all men are trash' but keep dating the same type of toxic men are addicted to drama and don't actually want healthy relationships.",
        options: [
          { key: "A", text: "Strongly Agree — They're choosing chaos then blaming all men for it" },
          { key: "B", text: "Somewhat Agree — Patterns reveal preferences more than complaints do" },
          { key: "C", text: "Somewhat Disagree — Breaking trauma bonds takes time and therapy" },
          { key: "D", text: "Strongly Disagree — Victim-blaming women for men's bad behavior is toxic" }
        ]
      }
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
        statement: "Your biggest bedroom confession that you'd only tell your girls:",
        options: [
          { key: "A", text: "I fake it sometimes to end it faster" },
          { key: "B", text: "I think about someone else during" },
          { key: "C", text: "I've never had the Big O with a partner" },
          { key: "D", text: "I'm way kinkier than I let on" }
        ]
      },
      {
        statement: "The sexiest thing a man can do outside the bedroom:",
        options: [
          { key: "A", text: "Cook me dinner without being asked" },
          { key: "B", text: "Defend me when I'm not around" },
          { key: "C", text: "Handle his business like a grown man" },
          { key: "D", text: "Make me laugh until I cry" }
        ]
      },
      {
        statement: "What would make you instantly end a hookup?",
        options: [
          { key: "A", text: "Bad hygiene situation" },
          { key: "B", text: "Selfish lover vibes" },
          { key: "C", text: "Too aggressive too fast" },
          { key: "D", text: "Weird dirty talk" }
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

// Optimized practice scenarios - memoized outside component
const practiceScenarios = [
  { id: 'first_date', label: 'First Date', description: 'Practice first date conversation' },
  { id: 'conflict_resolution', label: 'Conflict Resolution', description: 'Navigate relationship disagreements' },
  { id: 'deep_conversation', label: 'Deep Conversation', description: 'Practice meaningful dialogue' },
  { id: 'flirting', label: 'Flirting', description: 'Improve flirting skills' },
  { id: 'boundaries', label: 'Setting Boundaries', description: 'Practice boundary communication' },
  { id: 'awkward_moments', label: 'Awkward Moments', description: 'Handle uncomfortable situations' }
];

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
  
  // Optimized caching system
  const questionCacheRef = useRef(new Map<string, any>());
  const [isTransforming, setIsTransforming] = useState(false);
  const [isDepthChanging, setIsDepthChanging] = useState(false);
  
  const { getFlirtSuggestion, getAIResponse, isLoading } = useRelationshipAI();

  // Memoized conversation starters with user profile substitution
  const conversationStarters = useMemo(() => {
    return conversationStartersData.map(starter => ({
      ...starter,
      prompts: starter.prompts.map(prompt => {
        if (typeof prompt === 'string') {
          return prompt.replace('{loveLanguage}', userProfile.loveLanguage);
        }
        return prompt;
      })
    }));
  }, [userProfile.loveLanguage]);

  // Optimized helper functions
  const isMultipleChoice = useCallback((question: string | { statement: string; options: { key: string; text: string; }[] }): question is { statement: string; options: { key: string; text: string; }[] } => {
    return typeof question === 'object' && 'statement' in question;
  }, []);

  const getQuestionText = useCallback((question: string | { statement: string; options: { key: string; text: string; }[] }): string => {
    return isMultipleChoice(question) ? question.statement : question;
  }, [isMultipleChoice]);

  // Optimized share function with device detection
  const handleShare = useCallback(async (text: string) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let appStoreLink = 'https://purposely.app';
    if (isIOS) {
      appStoreLink = 'https://apps.apple.com/app/purposely-dating';
    } else if (isAndroid) {
      appStoreLink = 'https://play.google.com/store/apps/details?id=com.purposely.dating';
    }
    
    const shareText = `${text}\n\nSent with Purposely App\n${appStoreLink}`;
    
    try {
      if ((window as any).Capacitor) {
        await CapacitorShare.share({
          title: 'Conversation Starter from Purposely App',
          text: shareText,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Conversation Starter from Purposely App',
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Copied to clipboard!');
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
      }
    }
  }, []);

  // Optimized question depth adjustment with smart caching
  const adjustQuestionDepth = useCallback(async (originalQuestion: string, depth: number): Promise<string> => {
    const cacheKey = `${originalQuestion}_${depth}`;
    
    if (questionCacheRef.current.has(cacheKey)) {
      return questionCacheRef.current.get(cacheKey);
    }

    try {
      const depthInstructions = {
        0: "Make this witty and sarcastic (80 chars max). ONLY return the question.",
        1: "Make this balanced and engaging (80 chars max). ONLY return the question.", 
        2: "Make this deep and psychological (80 chars max). ONLY return the question."
      };

      const prompt = `Transform: "${originalQuestion}"\n\n${depthInstructions[depth as keyof typeof depthInstructions]}`;
      
      const response = await getAIResponse(prompt, userProfile, 'general');
      const result = response.trim().replace(/^["']|["']$/g, '').split('\n')[0].substring(0, 120);
      
      questionCacheRef.current.set(cacheKey, result);
      return result || originalQuestion;
      
    } catch (error) {
      console.error('Error adjusting question depth:', error);
      return originalQuestion;
    }
  }, [userProfile, getAIResponse]);

  // Optimized question transformation with batch processing
  const transformQuestionsForDepth = useCallback(async (
    questions: (string | { statement: string; options: { key: string; text: string; }[] })[], 
    depth: number
  ) => {
    if (depth === 1) return questions;

    setIsDepthChanging(true);
    
    try {
      const batchSize = 3;
      const transformedQuestions = [...questions];
      
      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(async (question) => {
            if (typeof question === 'string') {
              return await adjustQuestionDepth(question, depth);
            } else {
              const transformedStatement = await adjustQuestionDepth(question.statement, depth);
              return { statement: transformedStatement, options: question.options };
            }
          })
        );
        
        batchResults.forEach((result, batchIndex) => {
          transformedQuestions[i + batchIndex] = result;
        });
        
        setCurrentStarters([...transformedQuestions]);
        
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
  }, [adjustQuestionDepth]);

  // Optimized category selection
  const selectCategory = useCallback((category: string) => {
    if (category === "Customize") {
      setSelectedCategory(category);
      return;
    }

    const categoryData = conversationStarters.find(cat => cat.category === category) || 
                         { prompts: customCategories[category] || [] };
    
    setSelectedCategory(category);
    setIsCustom(category in customCategories);
    setCurrentStarters(categoryData.prompts);
    
    // Get daily question index
    const today = new Date().toDateString();
    const savedQuestionIndex = localStorage.getItem(`dailyQuestionIndex_${category}_${today}`);
    
    if (savedQuestionIndex) {
      setCurrentQuestionIndex(parseInt(savedQuestionIndex, 10));
    } else {
      const randomIndex = Math.floor(Math.random() * categoryData.prompts.length);
      setCurrentQuestionIndex(randomIndex);
      localStorage.setItem(`dailyQuestionIndex_${category}_${today}`, randomIndex.toString());
    }
    
    setShowCategorySelection(false);
  }, [conversationStarters, customCategories]);

  // Optimized custom starters generation
  const generateCustomStarters = useCallback(async () => {
    if (!customKeywords.trim()) return;

    try {
      setIsTransforming(true);
      
      const prompt = `Generate 8 engaging conversation starters for dating/relationships based on these keywords: "${customKeywords}". Make them personal, thought-provoking questions that spark meaningful dialogue. Each should be 1-2 sentences maximum. Only return the questions, numbered 1-8.`;
      
      const response = await getFlirtSuggestion(prompt, userProfile);
      const questions = response.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0);

      if (questions.length > 0) {
        setCurrentStarters(questions);
        setIsCustom(true);
        setSelectedCategory(`Custom: ${customKeywords}`);
        setCurrentQuestionIndex(0);
        setShowCategorySelection(false);
      }
    } catch (error) {
      console.error('Error generating custom starters:', error);
    } finally {
      setIsTransforming(false);
    }
  }, [customKeywords, userProfile, getFlirtSuggestion]);

  // Optimized navigation functions
  const nextQuestion = useCallback(async () => {
    const nextIndex = currentQuestionIndex + 1;
    
    // If we're at the end of current questions, generate more
    if (nextIndex >= currentStarters.length) {
      if (isCustom || selectedCategory === "Customize") {
        // For custom categories, just cycle back to beginning
        setCurrentQuestionIndex(0);
      } else {
        // For predefined categories, regenerate questions with AI
        const categoryData = conversationStarters.find(cat => cat.category === selectedCategory);
        if (categoryData) {
          setIsDepthChanging(true);
          try {
            // Apply depth transformation to generate new variations
            await transformQuestionsForDepth(categoryData.prompts, depthLevel[0]);
            setCurrentQuestionIndex(0);
          } catch (error) {
            console.error('Error generating new questions:', error);
            setCurrentQuestionIndex(0);
          } finally {
            setIsDepthChanging(false);
          }
        } else {
          setCurrentQuestionIndex(0);
        }
      }
    } else {
      setCurrentQuestionIndex(nextIndex);
    }
  }, [currentQuestionIndex, currentStarters.length, isCustom, selectedCategory, conversationStarters, depthLevel, transformQuestionsForDepth]);

  const previousQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => prev === 0 ? currentStarters.length - 1 : prev - 1);
  }, [currentStarters.length]);

  // Optimized touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    setTouchEnd({ x: touchEndX, y: touchEndY });

    const deltaX = touchStart.x - touchEndX;
    const deltaY = Math.abs(touchStart.y - touchEndY);

    if (deltaY < 50) { // Horizontal swipe
      if (deltaX > 50) nextQuestion(); // Swipe left
      else if (deltaX < -50) previousQuestion(); // Swipe right
    }
  }, [touchStart, nextQuestion, previousQuestion]);

  // Optimized custom category management
  const saveCurrentCustom = useCallback(() => {
    if (isCustom && currentStarters.length > 0) {
      const categoryName = selectedCategory.startsWith('Custom:') 
        ? selectedCategory.substring(8).trim() 
        : selectedCategory;
      setCustomCategories(prev => ({ ...prev, [categoryName]: currentStarters }));
      setSavedPacks(prev => ({ ...prev, [categoryName]: true }));
    }
  }, [isCustom, currentStarters, selectedCategory]);

  const deleteCustomCategory = useCallback((category: string) => {
    setCustomCategories(prev => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
    setSavedPacks(prev => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
  }, []);

  const renameCustomCategory = useCallback(() => {
    if (newCategoryName.trim() && selectedCategory in customCategories) {
      const starters = customCategories[selectedCategory];
      setCustomCategories(prev => {
        const updated = { ...prev };
        delete updated[selectedCategory];
        updated[newCategoryName.trim()] = starters;
        return updated;
      });
      setSelectedCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowRename(false);
    }
  }, [selectedCategory, customCategories, newCategoryName]);

  // Practice partner functions
  const startPracticeSession = useCallback((scenario: string) => {
    setPracticeScenario(scenario);
    setPracticePartnerActive(true);
    setShowPracticeInput(true);
    setPracticeMessages([]);
    
    const scenarioTexts = {
      'first_date': "Let's practice first date conversation! I'll be your date. Start with anything you'd like to talk about.",
      'conflict_resolution': "I'll roleplay a relationship disagreement. How would you approach resolving conflicts?",
      'deep_conversation': "Let's dive deep! I'll engage in meaningful dialogue with you. What's on your mind?",
      'flirting': "Time to practice your flirting skills! I'll respond as someone you're interested in.",
      'boundaries': "Let's practice setting boundaries. I'll present situations where you need to communicate your limits.",
      'awkward_moments': "I'll create awkward dating scenarios. Practice navigating them with confidence!"
    };
    
    setCurrentScenarioText(scenarioTexts[scenario as keyof typeof scenarioTexts] || "Let's practice!");
  }, []);

  const sendPracticeMessage = useCallback(async () => {
    if (!currentPracticeMessage.trim()) return;

    const userMessage = { role: 'user' as const, message: currentPracticeMessage };
    setPracticeMessages(prev => [...prev, userMessage]);
    setCurrentPracticeMessage('');

    try {
      const prompt = `You are an AI practice partner for relationship conversations. The scenario is: ${practiceScenario}. 
      
      Respond naturally and helpfully to: "${currentPracticeMessage}"
      
      Keep responses conversational, supportive, and realistic. If this is flirting practice, be playfully responsive. If it's conflict resolution, present reasonable concerns. Stay in character for the scenario.`;

      const response = await getAIResponse(prompt, userProfile, 'general');
      const aiMessage = { role: 'ai' as const, message: response.trim() };
      setPracticeMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error in practice conversation:', error);
    }
  }, [currentPracticeMessage, practiceScenario, userProfile, getAIResponse]);

  const endPracticeSession = useCallback(() => {
    setPracticePartnerActive(false);
    setShowPracticeInput(false);
    generateSessionFeedback();
  }, []);

  const generateSessionFeedback = useCallback(async () => {
    if (practiceMessages.length === 0) return;

    try {
      const conversationText = practiceMessages
        .map(msg => `${msg.role}: ${msg.message}`)
        .join('\n');

      const prompt = `Analyze this practice conversation and provide constructive feedback:

${conversationText}

Provide 2-3 specific insights about communication strengths and areas for improvement. Keep it encouraging and actionable.`;

      const feedback = await getAIResponse(prompt, userProfile, 'therapy');
      setSessionFeedback(feedback.trim());
      setShowFeedback(true);
    } catch (error) {
      console.error('Error generating feedback:', error);
    }
  }, [practiceMessages, userProfile, getAIResponse]);

  const openFullScreen = useCallback(() => {
    setIsFullScreen(true);
  }, []);

  // Optimized initialization effect
  React.useEffect(() => {
    const defaultCategory = conversationStarters.find(cat => cat.category === selectedCategory);
    if (defaultCategory && !isCustom) {
      setCurrentStarters(defaultCategory.prompts);
      
      const today = new Date().toDateString();
      const savedQuestionIndex = localStorage.getItem(`dailyQuestionIndex_${selectedCategory}_${today}`);
      
      if (savedQuestionIndex) {
        setCurrentQuestionIndex(parseInt(savedQuestionIndex, 10));
      } else {
        const randomIndex = Math.floor(Math.random() * defaultCategory.prompts.length);
        setCurrentQuestionIndex(randomIndex);
        localStorage.setItem(`dailyQuestionIndex_${selectedCategory}_${today}`, randomIndex.toString());
      }

      // Only apply depth transformation for Date Night master category
      if (masterCategory !== "Girl's Night" && depthLevel[0] !== 1) {
        setTimeout(() => {
          transformQuestionsForDepth(defaultCategory.prompts, depthLevel[0]);
        }, 100);
      }
    }
  }, [selectedCategory, isCustom, depthLevel, conversationStarters, transformQuestionsForDepth]);

  // Optimized depth switching effect - only for Date Night categories
  React.useEffect(() => {
    const switchDepth = async () => {
      if (currentStarters.length === 0) return;
      
      let baseQuestions: (string | { statement: string; options: { key: string; text: string; }[] })[];
      
      if (isCustom) {
        baseQuestions = customCategories[selectedCategory] || currentStarters;
      } else {
        const categoryData = conversationStarters.find(cat => cat.category === selectedCategory);
        baseQuestions = categoryData?.prompts || currentStarters;
      }

      // Only apply depth transformation for Date Night master category
      if (masterCategory === "Girl's Night") {
        setCurrentStarters(baseQuestions);
      } else if (depthLevel[0] === 1) {
        setCurrentStarters(baseQuestions);
      } else {
        await transformQuestionsForDepth(baseQuestions, depthLevel[0]);
      }
    };

    switchDepth();
  }, [depthLevel, isCustom, selectedCategory, customCategories, conversationStarters, transformQuestionsForDepth, masterCategory]); // Removed currentStarters from dependencies

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Clarity Coach
          </h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Master meaningful conversations, practice with AI, and craft perfect responses
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center">
        <div className="flex bg-muted rounded-lg p-1 gap-1">
          <Button
            variant={activeSection === 'starters' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('starters')}
            className="flex items-center gap-2 px-3"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Conversation Starters</span>
            <span className="sm:hidden">Starters</span>
          </Button>
          <Button
            variant={activeSection === 'textgenie' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('textgenie')}
            className="flex items-center gap-2 px-3"
          >
            <Wand2 className="w-4 h-4" />
            <span className="hidden sm:inline">Text Genie</span>
            <span className="sm:hidden">Genie</span>
          </Button>
          <Button
            variant={activeSection === 'practice' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('practice')}
            className="flex items-center gap-2 px-3"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">AI Practice</span>
            <span className="sm:hidden">Practice</span>
          </Button>
        </div>
      </div>

      {/* Content Sections */}
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
          isLoading={isLoading || isTransforming || isDepthChanging}
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

      {activeSection === 'textgenie' && (
        <TextGenie userProfile={userProfile} />
      )}

      {activeSection === 'practice' && (
        <div className="space-y-6">
          {!practicePartnerActive ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-primary">AI Practice Partner</h2>
                <p className="text-muted-foreground text-sm">
                  Practice real conversations with AI in different scenarios
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {practiceScenarios.map((scenario) => (
                  <Card key={scenario.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{scenario.label}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                      <Button 
                        onClick={() => startPracticeSession(scenario.id)}
                        className="w-full"
                        size="sm"
                      >
                        Start Practice
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-primary">Practice Session</h2>
                <Button onClick={endPracticeSession} variant="outline" size="sm">
                  End Session
                </Button>
              </div>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-4">{currentScenarioText}</p>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                    {practiceMessages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {showPracticeInput && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your response..."
                        value={currentPracticeMessage}
                        onChange={(e) => setCurrentPracticeMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendPracticeMessage()}
                      />
                      <Button onClick={sendPracticeMessage} size="sm" disabled={isLoading}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Feedback Modal */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Practice Session Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{sessionFeedback}</p>
            <Button onClick={() => setShowFeedback(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Screen Conversation Dialog */}
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">{selectedCategory}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="text-center px-2">
              {currentStarters.length > 0 && (
                <div className="space-y-6">
                  {isMultipleChoice(currentStarters[currentQuestionIndex]) ? (
                    <div className="space-y-4">
                      <p className="text-xl font-bold leading-relaxed">
                        {(currentStarters[currentQuestionIndex] as any).statement}
                      </p>
                      <div className="space-y-3 text-left max-w-md mx-auto">
                        {(currentStarters[currentQuestionIndex] as any).options.map((option: any) => (
                          <div key={option.key} className="p-3 bg-muted/50 border rounded-lg">
                            <span className="font-bold text-primary">{option.key}. </span>
                            <span className="text-foreground">{option.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto">
                      <p className="text-xl font-bold leading-relaxed text-center">
                        {getQuestionText(currentStarters[currentQuestionIndex]).split('\n').map((line, index) => (
                          <span key={index} className="block mb-2">
                            {line}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4">
              <Button 
                onClick={previousQuestion} 
                variant="outline" 
                size="sm"
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium">
                  {currentQuestionIndex + 1} of {currentStarters.length}
                </span>
              </div>
              
              <Button 
                onClick={nextQuestion} 
                variant="outline" 
                size="sm"
                disabled={isDepthChanging}
                className="flex items-center gap-2"
              >
                {isDepthChanging ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Generating...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">
                      {currentQuestionIndex === currentStarters.length - 1 ? 'Generate More' : 'Next'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="flex gap-2 px-4">
              <Button
                onClick={() => handleShare(getQuestionText(currentStarters[currentQuestionIndex]))}
                variant="outline"
                size="sm"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Share className="w-4 h-4" />
                Share
              </Button>
              <Button 
                onClick={() => setIsFullScreen(false)} 
                variant="romance"
                size="sm"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default React.memo(FlirtFuelModule);