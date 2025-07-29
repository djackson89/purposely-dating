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
    {
      category: "Date Night Debates",
      masterCategory: "Date Night",
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
        },
        {
          statement: "Co-parenting only works when one parent gives up control.",
          options: [
            { key: "A", text: "Strongly Agree — Two CEOs crash the company" },
            { key: "B", text: "Somewhat Agree — Someone has to lead" },
            { key: "C", text: "Somewhat Disagree — It's about balance" },
            { key: "D", text: "Strongly Disagree — Equal partnership is possible" }
          ]
        },
        {
          statement: "Women dating multiple men until commitment is manipulative.",
          options: [
            { key: "A", text: "Strongly Agree — Pick one and invest" },
            { key: "B", text: "Somewhat Agree — Mixed signals hurt people" },
            { key: "C", text: "Somewhat Disagree — It's just smart dating" },
            { key: "D", text: "Strongly Disagree — Men do it all the time" }
          ]
        },
        {
          statement: "Modern dating apps have ruined genuine romantic connections.",
          options: [
            { key: "A", text: "Strongly Agree — It's all surface level now" },
            { key: "B", text: "Somewhat Agree — Too many options, no depth" },
            { key: "C", text: "Somewhat Disagree — Depends how you use them" },
            { key: "D", text: "Strongly Disagree — Love finds a way" }
          ]
        },
        {
          statement: "Your friends' opinions about your partner should heavily influence your decisions.",
          options: [
            { key: "A", text: "Strongly Agree — They see what you can't" },
            { key: "B", text: "Somewhat Agree — Consider their perspective" },
            { key: "C", text: "Somewhat Disagree — It's your relationship" },
            { key: "D", text: "Strongly Disagree — Friends can be jealous too" }
          ]
        },
        {
          statement: "Living together before marriage prevents divorce.",
          options: [
            { key: "A", text: "Strongly Agree — Trial run is essential" },
            { key: "B", text: "Somewhat Agree — Better to know beforehand" },
            { key: "C", text: "Somewhat Disagree — Doesn't guarantee anything" },
            { key: "D", text: "Strongly Disagree — Changes relationship dynamic" }
          ]
        },
        {
          statement: "Men should always pay on first dates, regardless of who asked.",
          options: [
            { key: "A", text: "Strongly Agree — Traditional values matter" },
            { key: "B", text: "Somewhat Agree — Shows intention and respect" },
            { key: "C", text: "Somewhat Disagree — Split if she offered" },
            { key: "D", text: "Strongly Disagree — Equality means going Dutch" }
          ]
        },
        {
          statement: "Social media has made infidelity too easy and too common.",
          options: [
            { key: "A", text: "Strongly Agree — DMs are relationship killers" },
            { key: "B", text: "Somewhat Agree — Creates unnecessary temptation" },
            { key: "C", text: "Somewhat Disagree — Cheaters gonna cheat anyway" },
            { key: "D", text: "Strongly Disagree — It's about personal integrity" }
          ]
        }
      ]
    },
    {
      category: "Relationship Talk",
      masterCategory: "Date Night",
      prompts: [
        "What's something about love that you believed in your teens but laugh at now?",
        "How do you know the difference between settling and being realistic?",
        "What's the most important thing you've learned about yourself through dating?",
        "How has social media affected your expectations in relationships?",
        "What does 'ready for a relationship' actually mean to you?",
        "What's your biggest relationship fear that you're actively working on?",
        "How do you balance independence with building something together?",
        "What does emotional intelligence look like in dating for you?"
      ]
    },
    {
      category: "Getting to Know You",
      masterCategory: "Date Night",
      prompts: [
        "What's something that instantly makes you lose interest in someone?",
        "How do you prefer to resolve conflicts in relationships?",
        "What's your idea of a perfect lazy Sunday together?",
        "What childhood experience shaped your view of love the most?",
        "How do you show someone you care without using words?",
        "What's something you're passionate about that few people know?",
        "How do you recharge when you're feeling emotionally drained?",
        "What's your love language and how did you discover it?"
      ]
    },
    {
      category: "Future Plans",
      masterCategory: "Date Night",
      prompts: [
        "How do you see your ideal life looking in 5 years?",
        "What's something you want to accomplish together as a couple?",
        "How important is it that we have similar financial goals?",
        "What role do you want family to play in our relationship?",
        "How do you want to handle major life decisions together?",
        "What's your approach to balancing career and relationship?",
        "How do you feel about the timeline for relationship milestones?",
        "What does 'growing old together' mean to you?"
      ]
    },
    {
      category: "Personal Growth",
      masterCategory: "Date Night",
      prompts: [
        "What's something you're actively working to improve about yourself?",
        "How do you handle feedback or criticism in relationships?",
        "What's a habit you want to develop together?",
        "How do you support someone's growth without trying to change them?",
        "What does self-care look like in your daily life?",
        "How do you process stress and what helps you most?",
        "What's something you've forgiven yourself for recently?",
        "How do you know when you need space to work on yourself?"
      ]
    },
    {
      category: "Fun & Playful",
      masterCategory: "Date Night",
      prompts: [
        "What's the most spontaneous thing you've ever done for love?",
        "If we could go anywhere right now, where would you choose?",
        "What's your most embarrassing dating story?",
        "What song always gets you in a good mood?",
        "What's something silly that you find attractive in people?",
        "If you could have any superpower for dating, what would it be?",
        "What's your go-to karaoke song?",
        "What's the weirdest place you've ever been asked out?"
      ]
    },
    {
      category: "Pillow Talk & Tea",
      masterCategory: "Girl's Night",
      prompts: [
        "What's the spiciest text you've ever received that still makes you blush?",
        "What's your most embarrassing hookup story that you can laugh about now?",
        "What's something freaky you want to try but haven't told anyone?",
        "What's the most romantic thing someone's ever done that also turned you on?",
        "What's your biggest turn-on that most people wouldn't expect?",
        "What's something you pretended to like in bed but absolutely hated?",
        "What's the weirdest place you've ever gotten frisky?",
        "What's a sexual fantasy you'd actually want to live out?",
        "What's the best compliment you've ever received about your body?",
        "What's something you learned about sex way too late in life?",
        "What's your go-to move that never fails to drive someone wild?",
        "What's the most adventurous thing you've done between the sheets?"
      ]
    },
    {
      category: "Retrograde & Regrets",
      masterCategory: "Girl's Night",
      prompts: [
        "What's your sign's biggest red flag when it comes to relationships?",
        "Which zodiac sign always seems to break your heart and why do you keep going back?",
        "What does your Venus sign say about your love language?",
        "What's your most toxic trait according to your star chart?",
        "Which moon phase makes you the most emotionally unhinged in relationships?",
        "What's the most 'your sign' thing you've ever done in a relationship?",
        "Which planet in retrograde affects your dating life the most?",
        "What's your rising sign's dating superpower?",
        "Which zodiac signs are you most sexually compatible with?",
        "What does your birth chart say about your daddy issues?",
        "Which sign do you clash with the most and why can't you stay away?",
        "What manifestation ritual actually brought you your best relationship?"
      ]
    },
    {
      category: "Vulnerable & Valid",
      masterCategory: "Girl's Night",
      prompts: [
        "What's a dating insecurity you're still healing from?",
        "What's something about love that scares you but you want anyway?",
        "What's a toxic pattern you've broken that you're proud of?",
        "What's the kindest thing you've ever done for yourself after a breakup?",
        "What's a boundary you wish you'd set sooner in relationships?",
        "What's something about your past that you're no longer ashamed of?",
        "What's a fear about commitment that you're working through?",
        "What's the most healing thing someone has ever said to you about love?",
        "What's something you need to hear when you're feeling unlovable?",
        "What's a way you've grown that your younger self wouldn't recognize?",
        "What's a truth about relationships that took you too long to accept?",
        "What's something you're ready to release to make space for real love?"
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

  // Practice scenarios
  const practiceScenarios = {
    first_date: {
      title: "First Date Conversation",
      description: "Practice having engaging first date conversations",
      context: "You're on a coffee date with someone you matched with on a dating app. They seem nervous but interested."
    },
    relationship_check_in: {
      title: "Relationship Check-in",
      description: "Practice having deeper conversations with your partner",
      context: "You've been dating for a few months and want to have a conversation about where things are going."
    },
    conflict_resolution: {
      title: "Conflict Resolution",
      description: "Practice navigating disagreements constructively",
      context: "You and your partner had a disagreement about plans. Practice resolving it calmly and lovingly."
    },
    intimacy_conversation: {
      title: "Intimacy & Boundaries",
      description: "Practice discussing physical and emotional intimacy",
      context: "You want to have an open conversation about physical intimacy and boundaries with your partner."
    }
  };

  // Practice conversation functions
  const startPracticeSession = (scenario: string) => {
    setPracticeScenario(scenario);
    setPracticePartnerActive(true);
    setPracticeMessages([]);
    setShowPracticeInput(true);
    
    const scenarioData = practiceScenarios[scenario as keyof typeof practiceScenarios];
    setCurrentScenarioText(scenarioData.context);
    
    // AI opens with a scenario-appropriate message
    const openingMessages = {
      first_date: "Hi! Thanks for meeting me here. This place has great coffee. How was your day?",
      relationship_check_in: "I've been thinking about us lately, and I'd love to talk about how things have been going between us.",
      conflict_resolution: "I know we disagreed about this weekend's plans. Can we talk about it? I want to understand your perspective.",
      intimacy_conversation: "I feel really comfortable with you, and I think we should talk about what we're both comfortable with physically."
    };
    
    const aiMessage = openingMessages[scenario as keyof typeof openingMessages];
    setPracticeMessages([{ role: 'ai', message: aiMessage }]);
  };

  const sendPracticeMessage = async () => {
    if (!currentPracticeMessage.trim()) return;
    
    const userMessage = currentPracticeMessage;
    setCurrentPracticeMessage('');
    
    // Add user message
    setPracticeMessages(prev => [...prev, { role: 'user', message: userMessage }]);
    
    try {
      // Get AI response based on scenario
      const scenarioData = practiceScenarios[practiceScenario as keyof typeof practiceScenarios];
      const prompt = `You are roleplaying as someone in this scenario: ${scenarioData.context}. 
      The user just said: "${userMessage}". 
      Respond naturally and appropriately for this scenario. Keep it conversational and realistic. 
      Don't be overly agreeable - sometimes push back a little or ask follow-up questions like a real person would.
      Consider the user's profile: they are ${userProfile.age}, ${userProfile.relationshipStatus}, with ${userProfile.loveLanguage} love language.`;
      
      const aiResponse = await getAIResponse(prompt, userProfile, 'general');
      
      // Add AI response
      setPracticeMessages(prev => [...prev, { role: 'ai', message: aiResponse }]);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      setPracticeMessages(prev => [...prev, { 
        role: 'ai', 
        message: "I need a moment to think about that. Can you tell me more about how you're feeling?" 
      }]);
    }
  };

  const endPracticeSession = async () => {
    // Generate feedback
    try {
      const conversationSummary = practiceMessages.map(msg => 
        `${msg.role === 'user' ? 'You' : 'Partner'}: ${msg.message}`
      ).join('\n');
      
      const feedbackPrompt = `Based on this practice conversation, provide encouraging feedback:
      Scenario: ${practiceScenarios[practiceScenario as keyof typeof practiceScenarios].description}
      
      Conversation:
      ${conversationSummary}
      
      Provide 2-3 positive points about their communication and 1-2 gentle suggestions for improvement. 
      Be encouraging and specific. Consider their profile: ${userProfile.loveLanguage} love language, ${userProfile.personalityType} personality.`;
      
      const feedback = await getAIResponse(feedbackPrompt, userProfile, 'general');
      setSessionFeedback(feedback);
      setShowFeedback(true);
      
    } catch (error) {
      console.error('Error generating feedback:', error);
      setSessionFeedback("Great job practicing! Remember that real conversations take practice. Keep working on being authentic and listening actively.");
      setShowFeedback(true);
    }
    
    setPracticePartnerActive(false);
    setShowPracticeInput(false);
  };

  const renderPracticePartner = () => (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Practice Partner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!practicePartnerActive ? (
          <>
            <p className="text-muted-foreground">
              Practice having meaningful conversations with our AI partner. Choose a scenario to begin:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(practiceScenarios).map(([key, scenario]) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2"
                  onClick={() => startPracticeSession(key)}
                >
                  <span className="font-semibold">{scenario.title}</span>
                  <span className="text-sm text-muted-foreground">{scenario.description}</span>
                </Button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Scenario:</p>
              <p className="text-sm">{currentScenarioText}</p>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-3">
              {practiceMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-8'
                      : 'bg-muted mr-8'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))}
            </div>
            
            {showPracticeInput && (
              <div className="flex gap-2">
                <Input
                  value={currentPracticeMessage}
                  onChange={(e) => setCurrentPracticeMessage(e.target.value)}
                  placeholder="Type your response..."
                  onKeyPress={(e) => e.key === 'Enter' && sendPracticeMessage()}
                />
                <Button onClick={sendPracticeMessage} disabled={isLoading}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={endPracticeSession} variant="outline">
                End Session & Get Feedback
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderTextGenie = () => (
    <div className="mt-4">
      <TextGenie userProfile={userProfile} />
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'starters':
        return (
          <ConversationStartersSection 
            userProfile={userProfile}
            conversationStarters={conversationStarters}
            handleShare={handleShare}
          />
        );
      case 'practice':
        return renderPracticePartner();
      case 'textgenie':
        return renderTextGenie();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Flirt Fuel</h2>
            <p className="text-muted-foreground">Conversation starters, practice & text assistance</p>
          </div>
        </div>
        <InfoDialog
          title="About Flirt Fuel"
          description="Get personalized conversation starters, practice with AI partners, and get help crafting the perfect texts. All tailored to your relationship style and goals."
        />
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeSection === 'starters' ? 'default' : 'ghost'}
          onClick={() => setActiveSection('starters')}
          className="rounded-b-none"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Conversation Starters
        </Button>
        <Button
          variant={activeSection === 'practice' ? 'default' : 'ghost'}
          onClick={() => setActiveSection('practice')}
          className="rounded-b-none"
        >
          <Users className="w-4 h-4 mr-2" />
          Practice Partner
        </Button>
        <Button
          variant={activeSection === 'textgenie' ? 'default' : 'ghost'}
          onClick={() => setActiveSection('textgenie')}
          className="rounded-b-none"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Text Genie
        </Button>
      </div>

      {/* Active Section Content */}
      {renderActiveSection()}

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Practice Session Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm whitespace-pre-line">{sessionFeedback}</p>
            </div>
            <Button 
              onClick={() => setShowFeedback(false)}
              className="w-full"
            >
              Continue Practicing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlirtFuelModule;