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
    try {
      // Try Capacitor Share first (for mobile)
      if ((window as any).Capacitor) {
        await CapacitorShare.share({
          title: 'Conversation Starter from Clarity Coach',
          text: text,
        });
      } else {
        // Fallback to Web Share API
        if (navigator.share) {
          await navigator.share({
            title: 'Conversation Starter from Clarity Coach',
            text: text,
          });
        } else {
          // Fallback to clipboard
          await navigator.clipboard.writeText(text);
          alert('Copied to clipboard!');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Final fallback to clipboard
      try {
        await navigator.clipboard.writeText(text);
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
            { key: "B", text: "Somewhat Agree — Somebody has to pick peace over power" },
            { key: "C", text: "Somewhat Disagree — Communication can balance power" },
            { key: "D", text: "Strongly Disagree — Control isn't required, collaboration is" }
          ]
        },
        {
          statement: "Men with money date younger women because they know women their age won't tolerate them.",
          options: [
            { key: "A", text: "Strongly Agree — It's not preference, it's escape" },
            { key: "B", text: "Somewhat Agree — Age equals accountability" },
            { key: "C", text: "Somewhat Disagree — Some just connect better younger" },
            { key: "D", text: "Strongly Disagree — Love doesn't check birth dates" }
          ]
        },
        {
          statement: "Marriage doesn't make people more loyal—it just makes cheating more expensive.",
          options: [
            { key: "A", text: "Strongly Agree — Rings don't change habits" },
            { key: "B", text: "Somewhat Agree — The affair just comes with paperwork" },
            { key: "C", text: "Somewhat Disagree — Commitment still matters to some" },
            { key: "D", text: "Strongly Disagree — That mindset belongs to cheaters" }
          ]
        },
        {
          statement: "If you're not sexually compatible, the relationship is already on life support.",
          options: [
            { key: "A", text: "Strongly Agree — Chemistry is the foundation" },
            { key: "B", text: "Somewhat Agree — Desire makes everything smoother" },
            { key: "C", text: "Somewhat Disagree — Other things can keep it alive" },
            { key: "D", text: "Strongly Disagree — Y'all sound addicted to vibes" }
          ]
        },
        {
          statement: "Most women can't handle being with a man they have to take care of.",
          options: [
            { key: "A", text: "Strongly Agree — Nurture isn't the same as support" },
            { key: "B", text: "Somewhat Agree — The dynamic gets old fast" },
            { key: "C", text: "Somewhat Disagree — Some are built for that life" },
            { key: "D", text: "Strongly Disagree — Y'all underestimate feminine loyalty" }
          ]
        },
        {
          statement: "If you have to constantly ask your partner to touch you, you're not in a relationship—you're on an emotional payment plan.",
          options: [
            { key: "A", text: "Strongly Agree — Affection shouldn't require begging" },
            { key: "B", text: "Somewhat Agree — Attraction shows itself, not explains itself" },
            { key: "C", text: "Somewhat Disagree — Not everyone is expressive" },
            { key: "D", text: "Strongly Disagree — Love languages need reminders" }
          ]
        },
        {
          statement: "Dating apps didn't ruin love—people did.",
          options: [
            { key: "A", text: "Strongly Agree — It's the users, not the platform" },
            { key: "B", text: "Somewhat Agree — People are the problem, not the pixels" },
            { key: "C", text: "Somewhat Disagree — The swiping culture changed us" },
            { key: "D", text: "Strongly Disagree — Apps were built for short-term flings" }
          ]
        },
        {
          statement: "Some people don't want love—they just want someone to serve them emotionally.",
          options: [
            { key: "A", text: "Strongly Agree — Therapy would ruin their hustle" },
            { key: "B", text: "Somewhat Agree — They crave caretakers, not partners" },
            { key: "C", text: "Somewhat Disagree — Some are just unaware" },
            { key: "D", text: "Strongly Disagree — That's just trauma talking" }
          ]
        },
        {
          statement: "If your sex life requires alcohol to feel good, you're not compatible.",
          options: [
            { key: "A", text: "Strongly Agree — Liquor shouldn't be lube" },
            { key: "B", text: "Somewhat Agree — Sober sex tells the truth" },
            { key: "C", text: "Somewhat Disagree — Inhibitions are real" },
            { key: "D", text: "Strongly Disagree — Y'all just need better drinks" }
          ]
        }
      ]
    }
  ];


  // Function to adjust question depth based on slider
  const adjustQuestionDepth = async (originalQuestion: string, depth: number) => {
    try {
      const depthInstructions = {
        0: "Transform this into a sarcastic, witty question with dark humor. Make it snarky and playfully provocative - like asking someone 'At what point did you realize you were toxic and are you still a walking red flag or have you completed rehab?' Keep it edgy but still conversational.",
        1: "Keep this question casual and balanced - mix of thought-provoking and light elements.",
        2: "Make this question deeper, more complex, and thought-provoking for serious conversations that build thorough understanding."
      };

      const prompt = `Take this conversation starter: "${originalQuestion}" and ${depthInstructions[depth as keyof typeof depthInstructions]} Keep the core intent but adjust the tone and complexity. Return only the adjusted question.`;
      
      const response = await getAIResponse(prompt, userProfile, 'general');
      return response.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
    } catch (error) {
      console.error('Error adjusting question depth:', error);
      return originalQuestion; // Fallback to original
    }
  };

  // Initialize current starters with default category and daily shuffling
  React.useEffect(() => {
    const defaultCategory = conversationStarters.find(cat => cat.category === selectedCategory);
    if (defaultCategory && !isCustom) {
      setCurrentStarters(defaultCategory.prompts);
      
      // Get or set daily question index
      const today = new Date().toDateString();
      const savedQuestionIndex = localStorage.getItem(`dailyQuestionIndex_${selectedCategory}_${today}`);
      
      if (savedQuestionIndex) {
        setCurrentQuestionIndex(parseInt(savedQuestionIndex, 10));
      } else {
        // Generate new daily question index
        const randomIndex = Math.floor(Math.random() * defaultCategory.prompts.length);
        setCurrentQuestionIndex(randomIndex);
        localStorage.setItem(`dailyQuestionIndex_${selectedCategory}_${today}`, randomIndex.toString());
      }
    }
  }, [selectedCategory, isCustom]);

  // Adjust starters based on depth level
  React.useEffect(() => {
    const adjustStarters = async () => {
      if (!isCustom && currentStarters.length > 0) {
        const defaultCategory = conversationStarters.find(cat => cat.category === selectedCategory);
        if (defaultCategory) {
          // Only adjust if depth is not casual (1)
          if (depthLevel[0] !== 1) {
            const adjustedStarters = await Promise.all(
              defaultCategory.prompts.map(question => adjustQuestionDepth(question, depthLevel[0]))
            );
            setCurrentStarters(adjustedStarters);
          } else {
            // Reset to original questions for casual level
            setCurrentStarters(defaultCategory.prompts);
          }
        }
      }
    };

    adjustStarters();
  }, [depthLevel, selectedCategory, isCustom]);

  // Check for stored practice scenario from Home page navigation
  React.useEffect(() => {
    const storedScenario = localStorage.getItem('practiceScenario');
    const activePracticeSection = localStorage.getItem('activePracticeSection');
    
    if (storedScenario && activePracticeSection === 'practice') {
      setActiveSection('practice');
      setCurrentScenarioText(storedScenario);
      setPracticeMessages([{ role: 'ai', message: storedScenario }]);
      setPracticePartnerActive(true);
      setShowPracticeInput(true);
      
      // Clear the stored data after using it
      localStorage.removeItem('practiceScenario');
      localStorage.removeItem('activePracticeSection');
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
        line.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').replace(/[""'']/g, '"').replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()
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
          line.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').replace(/[""'']/g, '"').replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()
        ).slice(0, 8);
        
        if (questions.length > 0) {
          setCurrentStarters(questions);
          setCurrentQuestionIndex(0);
        }
      } catch (error) {
        console.error('Error loading more starters:', error);
        // Fallback: shuffle the existing questions
        const shuffled = [...customCategories[selectedCategory]].sort(() => Math.random() - 0.5);
        setCurrentStarters(shuffled);
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
              line.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').replace(/[""'']/g, '"').replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()
            ).slice(0, 8);
          } else {
            // Parse regular questions
            questions = response.split('\n').filter(line => 
              line.trim() && 
              (line.includes('?') || line.match(/^\d+\.?/))
            ).map(line => 
              line.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').replace(/[""'']/g, '"').replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()
            ).slice(0, 8);
          }
          
          if (questions.length > 0) {
            setCurrentStarters(questions);
            setCurrentQuestionIndex(0);
          } else {
            throw new Error('No valid questions generated');
          }
        } catch (error) {
          console.error('Error loading more starters:', error);
          // Fallback: shuffle the original questions as backup
          const shuffled = [...category.prompts].sort(() => Math.random() - 0.5);
          setCurrentStarters(shuffled);
          setCurrentQuestionIndex(0);
        }
      }
    }
  };

  const selectCategory = (categoryName: string) => {
    if (categoryName === 'Customize') {
      // Set to custom mode and clear current starters
      setSelectedCategory('Customize');
      setIsCustom(false); // Reset custom flag
      setCurrentStarters([]); // Clear current starters to show customize interface
      setCustomKeywords('');
      return;
    }
    
    setSelectedCategory(categoryName);
    
    // Check if it's a custom category
    if (customCategories[categoryName]) {
      setIsCustom(true);
      setCurrentStarters(customCategories[categoryName]);
      setCurrentQuestionIndex(0);
    } else {
      setIsCustom(false);
      const category = conversationStarters.find(cat => cat.category === categoryName);
      if (category) {
        setCurrentStarters(category.prompts);
        setCurrentQuestionIndex(0);
      }
    }
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex < currentStarters.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Load more questions when reaching the end
      await loadMoreStarters();
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
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">Conversation Starters</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <InfoDialog
                title="Conversation Starters"
                description="Discover engaging questions and topics that spark meaningful conversations. Swipe through cards or use our AI to generate custom questions based on your interests and dating style."
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <Card className="shadow-soft border-primary/10">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label htmlFor="category-select" className="text-sm font-medium">Choose Category:</Label>
                <Select value={selectedCategory} onValueChange={selectCategory}>
                  <SelectTrigger className="w-full bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 transition-all duration-300 z-50">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-xl z-50 backdrop-blur-sm">
                    <SelectItem 
                      value="Customize"
                      className="bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 cursor-pointer font-medium text-primary border-b border-primary/10 mb-1"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-primary">✨</span>
                        <span>Customize</span>
                      </div>
                    </SelectItem>
                    {conversationStarters.map((category) => (
                      <SelectItem 
                        key={category.category} 
                        value={category.category}
                        className="bg-card hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/20 cursor-pointer transition-all duration-300 group"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-primary/60 group-hover:bg-primary transition-colors"></span>
                          <span className="group-hover:text-primary transition-colors">{category.category}</span>
                          {category.type === 'multiple-choice' && (
                            <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full ml-auto">
                              Debate
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                    {Object.keys(customCategories).map((categoryName) => (
                      <SelectItem 
                        key={categoryName} 
                        value={categoryName}
                        className="bg-card hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/20 cursor-pointer transition-all duration-300 group"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-secondary/60 group-hover:bg-secondary transition-colors"></span>
                          <span className="group-hover:text-secondary transition-colors">{categoryName}</span>
                          <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full ml-auto">
                            Custom
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Save/Manage button for custom categories */}
                {isCustom && currentStarters.length > 0 && (
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
                )}
              </div>
            </CardContent>
          </Card>

          {/* Custom Input - Only show when Customize is selected */}
          {selectedCategory === 'Customize' && (
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

          {/* Question Card Game */}
          {currentStarters.length > 0 && (
            <div className="space-y-4">

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
                    {/* Expand icon */}
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
              </div>

              {/* Depth Slider */}
              <Card className="shadow-soft border-primary/10">
                <CardContent className="pt-6 pb-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-primary">Question Depth</span>
                      <span className="text-xs text-muted-foreground">
                        {depthLevel[0] === 0 ? 'Light' : depthLevel[0] === 1 ? 'Casual' : 'Deep'}
                      </span>
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
                  <span>{isLoading ? '...' : 'Next'}</span>
                  <span>→</span>
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
            </div>
          )}
        </div>
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

            {/* Navigation arrows */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <Button
                onClick={previousQuestion}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-full w-12 h-12 opacity-80 hover:opacity-100 transition-opacity"
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </div>
            
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
              <Button
                onClick={nextQuestion}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-full w-12 h-12 opacity-80 hover:opacity-100 transition-opacity"
                disabled={currentQuestionIndex === currentStarters.length - 1}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>

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
            <div 
              className="flex-1 flex items-center justify-center p-8 select-none cursor-pointer"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
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
                    {getQuestionText(currentStarters[currentQuestionIndex])?.replace(/\*\*/g, '').replace(/[""'']/g, '"').replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()}
                  </p>
                )}
              </div>
            </div>

            {/* Navigation indicators */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
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

            {/* Swipe instructions */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
              <p className="text-white/70 text-sm">Swipe or tap arrows to navigate</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlirtFuelModule;