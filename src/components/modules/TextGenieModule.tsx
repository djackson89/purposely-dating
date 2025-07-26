import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Mic, Camera, Image, ChevronDown, ChevronUp, Copy, RotateCcw } from 'lucide-react';
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

  const getFallbackReplies = (replyType: 'flirt' | 'reply' | 'clap'): ReplyOption[] => {
    switch (replyType) {
      case 'flirt':
        return [
          {
            sweet: {
              text: "That's really sweet of you to say 😊",
              perspective: "This gentle response acknowledges their compliment while keeping things light and friendly. Perfect when you want to show appreciation without escalating too quickly."
            },
            mild: {
              text: "Interesting... tell me more 😏",
              perspective: "Shows intrigue while maintaining mystery. This balanced approach keeps them talking while showing you're engaged and confident."
            },
            spicy: {
              text: "You're going to have to try harder than that 🔥",
              perspective: "A bold challenge that tests their confidence. This reply shows you have high standards and aren't easily impressed - use when you want to see if they can step up their game."
            }
          },
          {
            sweet: {
              text: "You always know what to say 💕",
              perspective: "A warm, appreciative response that builds connection. This works well when they've been consistently thoughtful and you want to encourage more of that energy."
            },
            mild: {
              text: "I like where this is going 💫",
              perspective: "Direct positive reinforcement that shows interest without giving everything away. This signals you're open to more while maintaining your position of power."
            },
            spicy: {
              text: "Keep talking like that and see what happens 🔥",
              perspective: "Creates anticipation and sexual tension. This daring response shows confidence and hints at possibilities while keeping them wanting more."
            }
          },
          {
            sweet: {
              text: "That made me smile ☺️",
              perspective: "Simple and genuine, this response shares your positive reaction. Great for when their message genuinely brightened your mood and you want to let them know."
            },
            mild: {
              text: "You're smooth, I'll give you that 😉",
              perspective: "Acknowledges their effort while maintaining your power. This shows you recognize game when you see it, but you're not easily swayed."
            },
            spicy: {
              text: "Is that your best line? I'm not that easy 😈",
              perspective: "A playful rejection that challenges them to do better. Use this when they're being lazy with their approach and you want to see real effort."
            }
          }
        ];
      case 'reply':
        return [
          {
            sweet: {
              text: "That's such a thoughtful way to look at it",
              perspective: "Validates their perspective warmly. This response shows you appreciate their depth and creates space for meaningful conversation."
            },
            mild: {
              text: "That's really interesting! What made you think about that?",
              perspective: "Shows genuine interest and asks for deeper insight. This keeps the conversation flowing naturally while encouraging them to share more."
            },
            spicy: {
              text: "Finally, someone with an actual brain. Tell me more.",
              perspective: "A direct compliment that sets high standards. This response rewards intelligence while implying many others don't meet your intellectual expectations."
            }
          },
          {
            sweet: {
              text: "I love hearing your thoughts on this",
              perspective: "Encouraging and warm, this makes them feel valued for their mind. Perfect when you want to build emotional connection and show appreciation."
            },
            mild: {
              text: "I can relate to that. Have you experienced something similar before?",
              perspective: "Creates connection through shared experience. This builds rapport while opening up space for them to be more vulnerable."
            },
            spicy: {
              text: "Most people don't think that deeply. I'm impressed.",
              perspective: "Separates them from the crowd while giving a rare compliment. This makes them feel special while establishing your high standards."
            }
          },
          {
            sweet: {
              text: "You have such a unique perspective on things",
              perspective: "Celebrates their individuality in a gentle way. This builds their confidence while showing you pay attention to what makes them different."
            },
            mild: {
              text: "Tell me more about your perspective on this",
              perspective: "Shows you value their thoughts and opinions. This response demonstrates respect for their mind while keeping the conversation going."
            },
            spicy: {
              text: "I don't usually meet people who think like this. Keep going.",
              perspective: "A powerful statement that makes them feel rare and valuable. This implies most people bore you, but they've captured your attention."
            }
          }
        ];
      case 'clap':
        return [
          {
            sweet: {
              text: "I'd prefer if we could keep this conversation respectful",
              perspective: "A gentle but firm boundary. This gives them a chance to correct course while making your standards clear without being harsh."
            },
            mild: {
              text: "That's not how I operate. I expect better communication than that.",
              perspective: "Firmly communicates your standards without room for misinterpretation. This shows you won't tolerate poor treatment while staying professional."
            },
            spicy: {
              text: "Try that approach with someone else. I'm not the one.",
              perspective: "A definitive shutdown that leaves no room for negotiation. This response makes it crystal clear you won't tolerate disrespect or manipulation."
            }
          },
          {
            sweet: {
              text: "I don't think that's the energy I'm looking for right now",
              perspective: "A diplomatic way to redirect unwanted behavior. This allows them to save face while making your boundaries clear."
            },
            mild: {
              text: "I value myself too much to engage with that energy. Try again.",
              perspective: "Demonstrates self-worth while giving them an opportunity to correct course. This teaches them how you expect to be treated."
            },
            spicy: {
              text: "The audacity. Do better or don't bother.",
              perspective: "A sharp response that calls out inappropriate behavior directly. This shows you won't tolerate disrespect and have zero patience for poor treatment."
            }
          },
          {
            sweet: {
              text: "I think we might be looking for different things",
              perspective: "A kind but clear way to establish incompatibility. This response protects your peace while being considerate of their feelings."
            },
            mild: {
              text: "That approach doesn't work with me. I prefer authentic connection.",
              perspective: "Redirects them toward better behavior while staying open to improvement. This educates them on what actually attracts you."
            },
            spicy: {
              text: "I'm worth more than low-effort conversation. Level up or log off.",
              perspective: "A fierce response that demands excellence. This either filters them out completely or motivates them to bring their A-game."
            }
          }
        ];
      default:
        return [];
    }
  };

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
      return [getFallbackReplies(replyType)[0]];
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
      
      // Provide fallback suggestions based on type
      const fallbackOptions = getFallbackReplies(replyType);
      setReplyOptions(prev => ({ ...prev, [replyType]: fallbackOptions }));
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    // Find which reply types have existing options and regenerate them
    const activeTypes = Object.entries(replyOptions).filter(([_, options]) => options.length > 0);
    
    if (activeTypes.length > 0) {
      // Regenerate the first active type (or you could regenerate all)
      const [firstActiveType] = activeTypes[0];
      await handleGenerateReplies(firstActiveType as 'flirt' | 'reply' | 'clap');
    }
  };

  const handleImageUpload = async () => {
    try {
      const photo = await selectPhoto();
      if (photo) {
        setAttachedImages(prev => [...prev, photo.dataUrl || photo.webPath || '']);
        toast({
          title: "Image attached",
          description: "Screenshot added to conversation context.",
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to attach image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        // In a real implementation, you'd send this to a speech-to-text service
        toast({
          title: "Recording complete",
          description: "Voice input feature coming soon!",
        });
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak your message now...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone.",
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
           
           {/* Generate Response Button - moved directly below input */}
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


      {/* Send This Section */}
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

      {isLoading && (
        <Card className="shadow-soft border-primary/10">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{loadingMessage}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TextGenieModule;