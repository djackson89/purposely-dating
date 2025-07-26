import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Mic, Camera, Image, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import { useCamera } from '@/hooks/useCamera';
import { useToast } from '@/components/ui/use-toast';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface TextGenieModuleProps {
  userProfile: OnboardingData;
}

interface ReplyOption {
  text: string;
  context: string;
  situation: string;
  outcome: string;
}

interface ConversationAnalysis {
  interpretation: string;
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
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { getAIResponse } = useRelationshipAI();
  const { selectPhoto, showPhotoOptions } = useCamera();
  const { toast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasInput = inputText.trim() || attachedImages.length > 0;

  const getFallbackReplies = (replyType: 'flirt' | 'reply' | 'clap'): ReplyOption[] => {
    switch (replyType) {
      case 'flirt':
        return [
          {
            text: "Interesting... tell me more 😏",
            context: "Shows intrigue while maintaining mystery",
            situation: "When you want to keep the conversation playful",
            outcome: "Encourages them to elaborate while showing interest"
          },
          {
            text: "I like where this is going 💕",
            context: "Direct positive reinforcement with flirty energy",
            situation: "When the conversation has romantic potential",
            outcome: "Escalates romantic tension in a confident way"
          },
          {
            text: "You're smooth, I'll give you that 😉",
            context: "Acknowledges their effort while maintaining your power",
            situation: "When they're trying to impress you",
            outcome: "Shows appreciation while staying in control"
          }
        ];
      case 'reply':
        return [
          {
            text: "That's really interesting! What made you think about that?",
            context: "Shows genuine interest and asks for deeper insight",
            situation: "When you want to keep the conversation flowing naturally",
            outcome: "Encourages them to share more and deepens the connection"
          },
          {
            text: "I can relate to that. Have you experienced something similar before?",
            context: "Creates connection through shared experience",
            situation: "When you want to build rapport and understanding",
            outcome: "Establishes common ground and emotional connection"
          },
          {
            text: "Tell me more about your perspective on this",
            context: "Shows you value their thoughts and opinions",
            situation: "When you want to understand them better",
            outcome: "Makes them feel heard and valued"
          }
        ];
      case 'clap':
        return [
          {
            text: "I'm not comfortable with that tone. Let's keep this respectful.",
            context: "Sets clear boundaries while remaining professional",
            situation: "When someone crosses a line but you want to give them a chance",
            outcome: "Establishes your standards without ending the conversation"
          },
          {
            text: "That's not how I operate. I expect better communication than that.",
            context: "Firmly communicates your standards and expectations",
            situation: "When someone is being disrespectful or manipulative",
            outcome: "Shows you won't tolerate poor treatment"
          },
          {
            text: "I value myself too much to engage with that energy. Try again.",
            context: "Demonstrates self-worth while giving them an opportunity to correct course",
            situation: "When someone needs a reality check about their approach",
            outcome: "Teaches them how you expect to be treated"
          }
        ];
      default:
        return [];
    }
  };

  const analyzeConversation = async (content: string): Promise<ConversationAnalysis> => {
    const prompt = `Analyze this conversation context and identify the underlying message type. Content: "${content}"

    Determine:
    1. The message type (manipulation, attraction, deep_feelings, disrespect, casual, flirty)
    2. Your confidence level (1-10)
    3. A brief interpretation explaining what's really happening

    Respond in this exact format:
    TYPE: [message_type]
    CONFIDENCE: [1-10]
    INTERPRETATION: [your analysis]`;

    try {
      const response = await getAIResponse(prompt, userProfile, 'general');
      
      const typeMatch = response.match(/TYPE:\s*(\w+)/i);
      const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/i);
      const interpretationMatch = response.match(/INTERPRETATION:\s*(.+)/is);
      
      return {
        messageType: (typeMatch?.[1] || 'casual') as any,
        confidence: parseInt(confidenceMatch?.[1] || '5'),
        interpretation: interpretationMatch?.[1]?.trim() || 'Unable to analyze conversation fully.'
      };
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      
      // Show user-friendly error message
      toast({
        title: "AI Service Unavailable",
        description: "OpenAI quota exceeded. Please contact support or try again later.",
        variant: "destructive",
      });
      
      // Provide fallback analysis
      return {
        messageType: 'casual',
        confidence: 5,
        interpretation: 'AI analysis temporarily unavailable due to quota limits. The conversation appears to be casual in nature.'
      };
    }
  };

  const generateReplies = async (content: string, replyType: 'flirt' | 'reply' | 'clap', analysis: ConversationAnalysis) => {
    let prompt = '';
    
    switch (replyType) {
      case 'flirt':
        prompt = `Generate 3 flirty, playful text responses to this conversation context: "${content}"
        
        Analysis: ${analysis.interpretation}
        Message type: ${analysis.messageType}
        
        Create responses that are confident, fun, and engage with any flirtatious energy while maintaining your standards. Each response should include the message text and explain the strategy behind it.
        
        Format each as:
        TEXT: [message]
        CONTEXT: [why this works]
        SITUATION: [when to use this]
        OUTCOME: [what this achieves]`;
        break;
        
      case 'reply':
        prompt = `Generate 3 natural conversation responses to this context: "${content}"
        
        Analysis: ${analysis.interpretation}
        Message type: ${analysis.messageType}
        
        Create responses that keep the conversation flowing naturally, show interest, and ask engaging questions. The user is a confident, intelligent woman.
        
        Format each as:
        TEXT: [message]
        CONTEXT: [why this works]
        SITUATION: [when to use this]
        OUTCOME: [what this achieves]`;
        break;
        
      case 'clap':
        prompt = `Generate 3 firm boundary-setting responses to this context: "${content}"
        
        Analysis: ${analysis.interpretation}
        Message type: ${analysis.messageType}
        
        Create responses that set clear boundaries, assert standards, and communicate self-respect. The user is a confident, intelligent woman who won't tolerate disrespect.
        
        Format each as:
        TEXT: [message]
        CONTEXT: [why this works]
        SITUATION: [when to use this]
        OUTCOME: [what this achieves]`;
        break;
    }

    try {
      const response = await getAIResponse(prompt, userProfile, 'general');
      
      // Parse the response into structured options
      const options: ReplyOption[] = [];
      const sections = response.split('TEXT:').slice(1);
      
      sections.forEach(section => {
        const textMatch = section.match(/^([^]*?)(?=CONTEXT:|$)/);
        const contextMatch = section.match(/CONTEXT:\s*([^]*?)(?=SITUATION:|$)/);
        const situationMatch = section.match(/SITUATION:\s*([^]*?)(?=OUTCOME:|$)/);
        const outcomeMatch = section.match(/OUTCOME:\s*([^]*?)$/);
        
        if (textMatch) {
          options.push({
            text: textMatch[1].trim(),
            context: contextMatch?.[1]?.trim() || '',
            situation: situationMatch?.[1]?.trim() || '',
            outcome: outcomeMatch?.[1]?.trim() || ''
          });
        }
      });
      
      return options.slice(0, 3); // Ensure max 3 options
    } catch (error) {
      console.error('Error generating replies:', error);
      return [];
    }
  };

  const handleGenerateReplies = async (replyType: 'flirt' | 'reply' | 'clap') => {
    if (!hasInput) return;
    
    setIsLoading(true);
    
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
      manipulation: { label: 'Manipulation', color: 'destructive' },
      attraction: { label: 'Secret Attraction', color: 'romance' },
      deep_feelings: { label: 'Deep Feelings', color: 'primary' },
      disrespect: { label: 'Disrespect', color: 'destructive' },
      casual: { label: 'Casual Chat', color: 'secondary' },
      flirty: { label: 'Flirty Vibes', color: 'romance' }
    };
    return types[type as keyof typeof types] || types.casual;
  };

  const toggleContext = (type: string, index: number) => {
    const key = `${type}-${index}`;
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
        </CardContent>
      </Card>

      {/* Analysis Section */}
      {analysis && (
        <Card className="shadow-soft border-primary/10">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Purposely Perspective</h3>
                <Badge variant={getMessageTypeDisplay(analysis.messageType).color as any}>
                  {getMessageTypeDisplay(analysis.messageType).label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.interpretation}
              </p>
              <div className="text-xs text-muted-foreground">
                Confidence: {analysis.confidence}/10
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reply Type Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          onClick={() => handleGenerateReplies('flirt')}
          disabled={!hasInput || isLoading}
          variant={!hasInput ? "outline" : "default"}
          className={`flex flex-col p-4 h-auto ${
            hasInput ? 'bg-rose-500 hover:bg-rose-600 text-white' : ''
          }`}
        >
          <span className="font-medium">Flirt Back</span>
          <span className="text-xs opacity-80">Playful & Fun</span>
        </Button>
        <Button
          onClick={() => handleGenerateReplies('reply')}
          disabled={!hasInput || isLoading}
          variant={!hasInput ? "outline" : "default"}
          className={`flex flex-col p-4 h-auto ${
            hasInput ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
          }`}
        >
          <span className="font-medium">Reply Back</span>
          <span className="text-xs opacity-80">Keep It Going</span>
        </Button>
        <Button
          onClick={() => handleGenerateReplies('clap')}
          disabled={!hasInput || isLoading}
          variant={!hasInput ? "outline" : "default"}
          className={`flex flex-col p-4 h-auto ${
            hasInput ? 'bg-purple-500 hover:bg-purple-600 text-white' : ''
          }`}
        >
          <span className="font-medium">Clap Back</span>
          <span className="text-xs opacity-80">Set Boundaries</span>
        </Button>
      </div>

      {/* Send This Section */}
      {(replyOptions.flirt.length > 0 || replyOptions.reply.length > 0 || replyOptions.clap.length > 0) && (
        <Card className="shadow-soft border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">Send This</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(replyOptions).map(([type, options]) =>
              options.length > 0 && (
                <div key={type} className="space-y-3">
                  <h4 className="font-medium capitalize text-primary">
                    {type === 'flirt' ? 'Flirt Back' : type === 'reply' ? 'Reply Back' : 'Clap Back'} Options
                  </h4>
                  {options.map((option, index) => {
                    const isExpanded = expandedContext[`${type}-${index}`];
                    return (
                      <div key={index} className="bg-muted/30 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="flex-1 font-medium text-sm leading-relaxed">
                            "{option.text}"
                          </p>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(option.text)}
                              className="p-2"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => shareMessage(option.text)}
                              className="p-2"
                            >
                              <Send className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {option.context && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleContext(type, index)}
                            className="text-xs text-primary hover:text-primary/80 p-0 h-auto font-normal underline"
                          >
                            Context {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                          </Button>
                        )}
                        
                        {isExpanded && (
                          <div className="text-xs text-muted-foreground space-y-2 pl-4 border-l-2 border-primary/20">
                            <div>
                              <strong>Why this works:</strong> {option.context}
                            </div>
                            <div>
                              <strong>When to use:</strong> {option.situation}
                            </div>
                            <div>
                              <strong>Expected outcome:</strong> {option.outcome}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card className="shadow-soft border-primary/10">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing conversation and generating replies...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TextGenieModule;