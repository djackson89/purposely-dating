import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Mic, Camera, Image, ChevronDown, ChevronUp, Copy, RotateCcw, Heart, MessageCircle, TrendingUp, Star, Bot } from 'lucide-react';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import { useCamera } from '@/hooks/useCamera';
import { useToast } from '@/components/ui/use-toast';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
  firstName?: string;
}

interface TextGenieModuleProps {
  userProfile: OnboardingData;
}

interface ReplyOption {
  sweet: {
    text: string;
    perspective: string;
  };
  mild: {
    text: string;
    perspective: string;
  };
  spicy: {
    text: string;
    perspective: string;
  };
}

interface ConversationAnalysis {
  interpretation: string;
  detailedAnalysis?: string;
  messageType: 'manipulation' | 'attraction' | 'deep_feelings' | 'disrespect' | 'casual' | 'flirty';
  confidence: number;
}

const TextGenieModule: React.FC<TextGenieModuleProps> = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState('analyze');
  const [inputText, setInputText] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<ConversationAnalysis | null>(null);
  const [replyOptions, setReplyOptions] = useState<{ [key: string]: ReplyOption[] }>({
    flirt: [],
    reply: [],
    clap: []
  });
  const [expandedContext, setExpandedContext] = useState<{ [key: string]: boolean }>({});
  const [expandedAnalysis, setExpandedAnalysis] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prospectAnalysis, setProspectAnalysis] = useState<string>('');
  const [conversationStarters, setConversationStarters] = useState<string[]>([]);
  const [practiceConversation, setPracticeConversation] = useState<{role: 'user' | 'ai', message: string}[]>([]);
  const [practiceInput, setPracticeInput] = useState('');
  
  const { getAIResponse } = useRelationshipAI();
  const { selectPhoto, showPhotoOptions } = useCamera();
  const { toast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasInput = inputText.trim() || attachedImages.length > 0;

  const getLoadingMessages = () => [
    "One sec, I've got just the reply for this…",
    "Hmm..interesting. Give me a second to think about this..",
    "Thinking.."
  ];

  const analyzeConversation = async (content: string): Promise<ConversationAnalysis> => {
    const userName = userProfile.firstName || 'love';
    const prompt = `You are a supportive, no-nonsense relationship coach speaking to ${userName}. Analyze this conversation context and identify the underlying message type. Content: "${content}"

    Determine:
    1. The message type (manipulation, attraction, deep_feelings, disrespect, casual, flirty)
    2. Your confidence level (1-10)
    3. A brief interpretation (maximum 1 sentence) explaining what's really happening - address ${userName} directly
    4. A detailed analysis for when they want more insight

    Respond in this exact format:
    TYPE: [message_type]
    CONFIDENCE: [1-10]
    INTERPRETATION: [brief 1-sentence analysis addressing ${userName} personally]
    DETAILED: [comprehensive analysis with deeper insights for ${userName}]`;

    try {
      const response = await getAIResponse(prompt, userProfile, 'general');
      
      const typeMatch = response.match(/TYPE:\s*(\w+)/i);
      const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/i);
      const interpretationMatch = response.match(/INTERPRETATION:\s*(.+?)(?=DETAILED:|$)/is);
      const detailedMatch = response.match(/DETAILED:\s*(.+)$/is);
      
      const userName = userProfile.firstName || 'love';
      let interpretation = interpretationMatch?.[1]?.trim() || 'Unable to analyze conversation fully.';
      let detailedAnalysis = detailedMatch?.[1]?.trim() || '';
      
      // Make the interpretation more personable
      if (!interpretation.toLowerCase().includes(userName.toLowerCase())) {
        interpretation = `${userName}, here's what I'm seeing: ${interpretation}`;
      }
      
      return {
        messageType: (typeMatch?.[1] || 'casual') as any,
        confidence: parseInt(confidenceMatch?.[1] || '5'),
        interpretation,
        detailedAnalysis
      };
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      
      // Show user-friendly error message
      toast({
        title: "AI Service Unavailable",
        description: "OpenAI quota exceeded. Please contact support or try again later.",
        variant: "destructive",
      });
      
      // Provide fallback analysis with personable tone
      const userName = userProfile.firstName || 'love';
      return {
        messageType: 'casual',
        confidence: 5,
        interpretation: `Hey ${userName}, while our AI is taking a quick break, I can still help you navigate this! From what I can see, this looks like a pretty standard casual conversation.`,
        detailedAnalysis: `Trust your instincts - you've got this! While our AI service is temporarily unavailable, remember that most conversations fall into predictable patterns. This seems like casual, friendly communication without any red flags. Stay confident in your responses and remember that authentic communication usually works best. You know yourself and your boundaries better than anyone! 💪`
      };
    }
  };

  const generateReplies = async (content: string, replyType: 'flirt' | 'reply' | 'clap', analysis: ConversationAnalysis) => {
    const userName = userProfile.firstName || 'love';
    const prompt = `Generate 3 text responses to this conversation context: "${content}"
        
    Analysis: ${analysis.interpretation}
    Message type: ${analysis.messageType}
    
    Create 3 responses with these specific tones:
    1. Sweet: Flirty and fun response, even to disrespect
    2. Mild: Inquisitive and curious while remaining neutral about what was said
    3. Spicy: Clapping back and setting firm, assertive boundaries if needed
    
    For each response, provide the message text and a warm, personable explanation of how it should land given the scenario. Address ${userName} directly in the explanations.
    
    Format as:
    SWEET: [message]
    SWEET_PERSPECTIVE: [warm explanation for ${userName}]
    MILD: [message]
    MILD_PERSPECTIVE: [warm explanation for ${userName}]
    SPICY: [message]
    SPICY_PERSPECTIVE: [warm explanation for ${userName}]`;

    try {
      const response = await getAIResponse(prompt, userProfile, 'general');
      
      // Parse the response into structured options
      const sweetMatch = response.match(/SWEET:\s*(.+?)(?=SWEET_PERSPECTIVE:|$)/s);
      const sweetPerspectiveMatch = response.match(/SWEET_PERSPECTIVE:\s*(.+?)(?=MILD:|$)/s);
      const mildMatch = response.match(/MILD:\s*(.+?)(?=MILD_PERSPECTIVE:|$)/s);
      const mildPerspectiveMatch = response.match(/MILD_PERSPECTIVE:\s*(.+?)(?=SPICY:|$)/s);
      const spicyMatch = response.match(/SPICY:\s*(.+?)(?=SPICY_PERSPECTIVE:|$)/s);
      const spicyPerspectiveMatch = response.match(/SPICY_PERSPECTIVE:\s*(.+?)$/s);
      
      if (sweetMatch && mildMatch && spicyMatch) {
        const option: ReplyOption = {
          sweet: {
            text: sweetMatch[1].trim().replace(/^["']|["']$/g, ''), // Remove quotes
            perspective: sweetPerspectiveMatch?.[1]?.trim() || ''
          },
          mild: {
            text: mildMatch[1].trim().replace(/^["']|["']$/g, ''), // Remove quotes
            perspective: mildPerspectiveMatch?.[1]?.trim() || ''
          },
          spicy: {
            text: spicyMatch[1].trim().replace(/^["']|["']$/g, ''), // Remove quotes
            perspective: spicyPerspectiveMatch?.[1]?.trim() || ''
          }
        };
        return [option];
      }
      
      // Return fallback if parsing fails
      return [];
      
    } catch (error) {
      console.error('Error generating replies:', error);
      return [];
    }
  };

  const handleGenerateReplies = async (replyType: 'flirt' | 'reply' | 'clap') => {
    if (!hasInput) return;
    
    setIsLoading(true);
    
    // Set random loading message
    const messages = getLoadingMessages();
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setLoadingMessage(randomMessage);
    
    try {
      let content = inputText;
      
      // If there are images, add them to context (in real implementation, you'd extract text from images)
      if (attachedImages.length > 0) {
        content += `\n\n[User also provided ${attachedImages.length} screenshot(s) of the conversation]`;
      }
      
      // Always analyze conversation first
      const currentAnalysis = await analyzeConversation(content);
      setAnalysis(currentAnalysis);
      
      // Generate replies for the specific type
      const replies = await generateReplies(content, replyType, currentAnalysis);
      setReplyOptions(prev => ({ ...prev, [replyType]: replies }));
      
    } catch (error) {
      console.error('Error generating replies:', error);
      
      // Show specific error message
      const errorMessage = error instanceof Error && error.message.includes('quota') 
        ? "OpenAI quota exceeded. Please contact support to resolve billing issues."
        : "Failed to generate replies. Please try again.";
        
      toast({
        title: "AI Error",
        description: errorMessage,
        variant: "destructive",
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  const generateProspectRanking = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    const userName = userProfile.firstName || 'love';
    
    const prompt = `You are a direct, no-nonsense dating coach helping ${userName} evaluate a dating prospect. Based on this conversation context: "${inputText}"
    
    Analyze this person's dating potential and give them a brutally honest ranking from 1-10 (where 10 is "marriage material" and 1 is "run away"). Consider:
    - Communication style and effort
    - Respect level and boundaries
    - Emotional maturity
    - Red flags vs green flags
    - Long-term potential
    
    Give a score and explain your reasoning in 2-3 sentences with your signature tough-love style. Address ${userName} directly.`;

    try {
      const response = await getAIResponse(prompt, userProfile, 'general');
      setProspectAnalysis(response);
    } catch (error) {
      console.error('Error generating prospect ranking:', error);
      toast({
        title: "AI Error",
        description: "Failed to generate prospect ranking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateConversationStarters = async () => {
    setIsLoading(true);
    const userName = userProfile.firstName || 'love';
    
    const prompt = `Generate 5 conversation starters for ${userName} based on their profile:
    - Love Language: ${userProfile.loveLanguage}
    - Age: ${userProfile.age}
    - Personality: ${userProfile.personalityType}
    - Relationship Status: ${userProfile.relationshipStatus}
    
    Create engaging, personality-appropriate conversation starters that feel natural and help build connection. Make them specific to their love language and personality type. Format as a simple list.`;

    try {
      const response = await getAIResponse(prompt, userProfile, 'general');
      const starters = response.split('\n').filter(line => line.trim()).map(line => line.replace(/^\d+\.?\s*/, '').trim());
      setConversationStarters(starters);
    } catch (error) {
      console.error('Error generating conversation starters:', error);
      toast({
        title: "AI Error", 
        description: "Failed to generate conversation starters. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startPracticeConversation = async () => {
    setIsLoading(true);
    const userName = userProfile.firstName || 'love';
    
    const prompt = `You're role-playing as a dating prospect that ${userName} is chatting with. Based on their profile:
    - Love Language: ${userProfile.loveLanguage}
    - Age: ${userProfile.age}
    - Personality: ${userProfile.personalityType}
    - Relationship Status: ${userProfile.relationshipStatus}
    
    Start a casual, flirty conversation as if you just matched on a dating app. Be engaging but realistic - not too forward, not too boring. Keep it short and natural.`;

    try {
      const response = await getAIResponse(prompt, userProfile, 'flirt');
      setPracticeConversation([{role: 'ai', message: response}]);
    } catch (error) {
      console.error('Error starting practice conversation:', error);
      toast({
        title: "AI Error",
        description: "Failed to start practice conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendPracticeMessage = async () => {
    if (!practiceInput.trim()) return;
    
    const userMessage = practiceInput.trim();
    setPracticeInput('');
    setPracticeConversation(prev => [...prev, {role: 'user', message: userMessage}]);
    
    setIsLoading(true);
    const userName = userProfile.firstName || 'love';
    
    const conversationHistory = practiceConversation.map(msg => 
      `${msg.role === 'user' ? userName : 'Match'}: ${msg.message}`
    ).join('\n');
    
    const prompt = `You're continuing a dating conversation with ${userName}. Here's the conversation so far:
    ${conversationHistory}
    ${userName}: ${userMessage}
    
    Respond as their dating match. Keep it natural, engaging, and appropriate for where you are in the conversation. Don't be too eager or too cold. Show interest but maintain some mystery.`;

    try {
      const response = await getAIResponse(prompt, userProfile, 'flirt');
      setPracticeConversation(prev => [...prev, {role: 'ai', message: response}]);
    } catch (error) {
      console.error('Error in practice conversation:', error);
      toast({
        title: "AI Error",
        description: "Failed to continue conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    await handleGenerateReplies('reply');
  };

  const handleImageUpload = async () => {
    const photo = await selectPhoto();
    if (photo && typeof photo === 'string') {
      setAttachedImages(prev => [...prev, photo]);
    } else if (photo && typeof photo === 'object' && 'webPath' in photo) {
      setAttachedImages(prev => [...prev, photo.webPath || '']);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        console.log('Audio data available:', event.data);
      };
      
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Failed to copy message.",
        variant: "destructive",
      });
    }
  };

  const shareMessage = async (text: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Text from Text Genie',
          text: text,
        });
      } else {
        await copyToClipboard(text);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      await copyToClipboard(text);
    }
  };

  const getMessageTypeDisplay = (type: string) => {
    const types = {
      manipulation: { label: 'Red Flag', color: 'destructive' },
      disrespect: { label: 'Red Flag', color: 'destructive' },
      attraction: { label: 'Possible Red Flag', color: 'default' },
      deep_feelings: { label: 'Green Flag', color: 'secondary' },
      casual: { label: '', color: 'secondary' },
      flirty: { label: 'Green Flag', color: 'secondary' }
    };
    return types[type as keyof typeof types] || { label: '', color: 'secondary' };
  };

  const toggleContext = (type: string, index: number, tone: string) => {
    const key = `${type}-${index}-${tone}`;
    setExpandedContext(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="pb-20 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
          Text Genie ✨
        </h1>
        <p className="text-muted-foreground">Send texts with confidence - flirt or set boundaries</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Analyze & Reply</span>
            <span className="sm:hidden">Reply</span>
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Prospect Ranking</span>
            <span className="sm:hidden">Ranking</span>
          </TabsTrigger>
          <TabsTrigger value="starters" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Conversation Starters</span>
            <span className="sm:hidden">Starters</span>
          </TabsTrigger>
          <TabsTrigger value="practice" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">A.I. Practice</span>
            <span className="sm:hidden">Practice</span>
          </TabsTrigger>
        </TabsList>

        {/* Analyze & Reply Tab */}
        <TabsContent value="analyze" className="space-y-6 mt-6">
          {/* Input Section */}
          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg">Conversation Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your conversation context here, or describe the situation you need help responding to..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[100px]"
              />
              
              {/* Attached Images */}
              {attachedImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img src={image} alt={`Screenshot ${index + 1}`} className="w-16 h-16 object-cover rounded border" />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                        onClick={() => setAttachedImages(prev => prev.filter((_, i) => i !== index))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
               {/* Input Controls */}
               <div className="flex gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleImageUpload}
                   className="flex-1"
                 >
                   <Camera className="w-4 h-4 mr-2" />
                   Add Screenshot
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={isRecording ? stopRecording : startRecording}
                   className={`flex-1 ${isRecording ? 'bg-red-100 border-red-300' : ''}`}
                 >
                   <Mic className={`w-4 h-4 mr-2 ${isRecording ? 'text-red-600' : ''}`} />
                   {isRecording ? 'Stop Recording' : 'Voice Input'}
                 </Button>
               </div>
               
               {/* Generate Response Button */}
               <div className="pt-4">
                 <Button
                   onClick={() => handleGenerateReplies('reply')}
                   disabled={!hasInput || isLoading}
                   variant={!hasInput ? "outline" : "default"}
                   className={`w-full px-8 py-4 h-auto ${
                     hasInput ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''
                   }`}
                 >
                   <span className="font-medium">Generate Response</span>
                 </Button>
               </div>
             </CardContent>
           </Card>

          {/* Analysis Section */}
          {analysis && (
            <Card className="shadow-soft border-primary/10">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Purposely Perspective</h3>
                    {getMessageTypeDisplay(analysis.messageType).label && (
                      <Badge variant={getMessageTypeDisplay(analysis.messageType).color as any}>
                        {getMessageTypeDisplay(analysis.messageType).label}
                      </Badge>
                    )}
                  </div>
                   <p className="text-sm text-muted-foreground leading-relaxed">
                     {analysis.interpretation.split('.')[0]}.
                   </p>
                  
                  {analysis.detailedAnalysis && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedAnalysis(!expandedAnalysis)}
                        className="text-xs text-primary hover:text-primary/80 p-0 h-auto font-normal underline"
                      >
                        Tell Me More {expandedAnalysis ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                      </Button>
                      
                      {expandedAnalysis && (
                        <div className="text-xs text-muted-foreground pl-4 border-l-2 border-primary/20 bg-muted/20 rounded-r p-3">
                          {analysis.detailedAnalysis}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response Options */}
          {(replyOptions.flirt.length > 0 || replyOptions.reply.length > 0 || replyOptions.clap.length > 0) && (
            <Card className="shadow-soft border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Response Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(replyOptions).map(([type, options]) =>
                  options.length > 0 && (
                    <div key={type} className="space-y-4">
                      {options.map((option, index) => (
                        <div key={index} className="space-y-4">
                          {/* Sweet Option */}
                          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Sweet</Badge>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <p className="flex-1 font-medium text-sm leading-relaxed">
                                "{option.sweet.text}"
                              </p>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(option.sweet.text)}
                                  className="p-2"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => shareMessage(option.sweet.text)}
                                  className="p-2"
                                >
                                  <Send className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {option.sweet.perspective && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleContext(type, index, 'sweet')}
                                  className="text-xs text-primary hover:text-primary/80 p-0 h-auto font-normal underline"
                                >
                                  Why this {expandedContext[`${type}-${index}-sweet`] ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                                </Button>
                                
                                {expandedContext[`${type}-${index}-sweet`] && (
                                  <div className="text-xs text-muted-foreground pl-4 border-l-2 border-green-200">
                                    {option.sweet.perspective}
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Mild Option */}
                          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Mild</Badge>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <p className="flex-1 font-medium text-sm leading-relaxed">
                                "{option.mild.text}"
                              </p>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(option.mild.text)}
                                  className="p-2"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => shareMessage(option.mild.text)}
                                  className="p-2"
                                >
                                  <Send className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {option.mild.perspective && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleContext(type, index, 'mild')}
                                  className="text-xs text-primary hover:text-primary/80 p-0 h-auto font-normal underline"
                                >
                                  Why this {expandedContext[`${type}-${index}-mild`] ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                                </Button>
                                
                                {expandedContext[`${type}-${index}-mild`] && (
                                  <div className="text-xs text-muted-foreground pl-4 border-l-2 border-blue-200">
                                    {option.mild.perspective}
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Spicy Option */}
                          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">Spicy</Badge>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <p className="flex-1 font-medium text-sm leading-relaxed">
                                "{option.spicy.text}"
                              </p>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(option.spicy.text)}
                                  className="p-2"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => shareMessage(option.spicy.text)}
                                  className="p-2"
                                >
                                  <Send className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {option.spicy.perspective && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleContext(type, index, 'spicy')}
                                  className="text-xs text-primary hover:text-primary/80 p-0 h-auto font-normal underline"
                                >
                                  Why this {expandedContext[`${type}-${index}-spicy`] ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                                </Button>
                                
                                {expandedContext[`${type}-${index}-spicy`] && (
                                  <div className="text-xs text-muted-foreground pl-4 border-l-2 border-red-200">
                                    {option.spicy.perspective}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
                
                {/* Retry Button */}
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    disabled={isLoading}
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Prospect Ranking Tab */}
        <TabsContent value="ranking" className="space-y-6 mt-6">
          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Dating Prospect Ranking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your conversation or describe this person's behavior to get a brutally honest ranking of their dating potential..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[100px]"
              />
              
              <Button
                onClick={generateProspectRanking}
                disabled={!inputText.trim() || isLoading}
                variant={!inputText.trim() ? "outline" : "default"}
                className="w-full"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Rank This Prospect
              </Button>
              
              {prospectAnalysis && (
                <Card className="bg-muted/30 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Prospect Analysis
                      </h4>
                      <p className="text-sm leading-relaxed">{prospectAnalysis}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversation Starters Tab */}
        <TabsContent value="starters" className="space-y-6 mt-6">
          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5" />
                Conversation Starters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Get personalized conversation starters based on your profile and love language.
              </p>
              
              <Button
                onClick={generateConversationStarters}
                disabled={isLoading}
                variant="default"
                className="w-full"
              >
                <Star className="w-4 h-4 mr-2" />
                Generate Conversation Starters
              </Button>
              
              {conversationStarters.length > 0 && (
                <Card className="bg-muted/30 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Your Personalized Starters
                      </h4>
                      <div className="space-y-3">
                        {conversationStarters.map((starter, index) => (
                          <div key={index} className="bg-background rounded-lg p-3 space-y-2">
                            <p className="text-sm leading-relaxed">"{starter}"</p>
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(starter)}
                                className="p-2"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => shareMessage(starter)}
                                className="p-2"
                              >
                                <Send className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* A.I. Practice Tab */}
        <TabsContent value="practice" className="space-y-6 mt-6">
          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="w-5 h-5" />
                A.I. Practice Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Practice your texting skills with an AI that acts like a real dating prospect. Build confidence before the real thing!
              </p>
              
              {practiceConversation.length === 0 ? (
                <Button
                  onClick={startPracticeConversation}
                  disabled={isLoading}
                  variant="default"
                  className="w-full"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Start Practice Conversation
                </Button>
              ) : (
                <div className="space-y-4">
                  {/* Conversation Display */}
                  <Card className="bg-muted/30 border-primary/20 max-h-64 overflow-y-auto">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {practiceConversation.map((msg, index) => (
                          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground ml-auto' 
                                : 'bg-background border'
                            }`}>
                              <p className="text-sm">{msg.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Message Input */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Type your response..."
                      value={practiceInput}
                      onChange={(e) => setPracticeInput(e.target.value)}
                      className="min-h-[80px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendPracticeMessage();
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={sendPracticeMessage}
                        disabled={!practiceInput.trim() || isLoading}
                        className="flex-1"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                      <Button
                        onClick={() => {
                          setPracticeConversation([]);
                          setPracticeInput('');
                        }}
                        variant="outline"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <Card className="shadow-soft border-primary/10">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{loadingMessage || "Generating..."}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TextGenieModule;