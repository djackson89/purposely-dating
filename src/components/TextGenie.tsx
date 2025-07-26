import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Camera, 
  Mic, 
  MicOff, 
  Upload, 
  Wand2, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  MessageSquare,
  Heart,
  Flame
} from 'lucide-react';
import { useCamera, PhotoResult } from '@/hooks/useCamera';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import { useToast } from '@/components/ui/use-toast';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface TextGenieProps {
  userProfile: OnboardingData;
}

interface ReplySuggestion {
  text: string;
  tone: 'sweet' | 'mild' | 'spicy';
  perspective: string;
}

const TextGenie: React.FC<TextGenieProps> = ({ userProfile }) => {
  const [description, setDescription] = useState('');
  const [toneLevel, setToneLevel] = useState([1]); // 0=Sweet, 1=Mild, 2=Spicy
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<PhotoResult[]>([]);
  const [replySuggestions, setReplySuggestions] = useState<ReplySuggestion[]>([]);
  const [expandedPerspectives, setExpandedPerspectives] = useState<{ [key: number]: boolean }>({});
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const { selectPhoto } = useCamera();
  const { getFlirtSuggestion, isLoading } = useRelationshipAI();
  const { toast } = useToast();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const loadingMessages = [
    "One sec, I've got just the reply for this…",
    "Hmm..interesting. Give me a second to think about this..",
    "Thinking.."
  ];

  useEffect(() => {
    if (isProcessing) {
      const messageIndex = Math.floor(Math.random() * loadingMessages.length);
      setLoadingMessage(loadingMessages[messageIndex]);
    }
  }, [isProcessing]);

  const getToneLabel = (level: number) => {
    switch (level) {
      case 0: return 'Sweet';
      case 1: return 'Mild';  
      case 2: return 'Spicy';
      default: return 'Mild';
    }
  };

  const getToneEmoji = (tone: 'sweet' | 'mild' | 'spicy') => {
    switch (tone) {
      case 'sweet': return '💕';
      case 'mild': return '💭';
      case 'spicy': return '🔥';
    }
  };

  const handleImageUpload = async () => {
    const photo = await selectPhoto();
    if (photo) {
      setUploadedImages(prev => [...prev, photo]);
      toast({
        title: "Image uploaded",
        description: "Ready to analyze your screenshot!",
      });
    }
  };

  const extractTextFromImages = async (images: PhotoResult[]): Promise<string> => {
    // For now, we'll simulate OCR functionality
    // In a real implementation, you'd use an OCR service like Google Vision API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("Sample extracted text from uploaded images. This would contain the actual conversation text in a real implementation.");
      }, 1000);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const transcript = await transcribeAudio(audioBlob);
        setDescription(prev => prev + (prev ? ' ' : '') + transcript);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak your message description...",
      });
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording stopped",
        description: "Converting speech to text...",
      });
    }
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    // For now, we'll simulate speech-to-text
    // In a real implementation, you'd use a service like OpenAI Whisper
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("This is sample transcribed text from your voice input.");
      }, 2000);
    });
  };

  const generateReplySuggestions = async () => {
    if (!description.trim() && uploadedImages.length === 0) {
      toast({
        title: "Input required",
        description: "Please provide a description or upload screenshots.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      let contextText = description;
      
      // Extract text from images if any
      if (uploadedImages.length > 0) {
        const extractedText = await extractTextFromImages(uploadedImages);
        contextText += (contextText ? '\n\n' : '') + `From screenshots: ${extractedText}`;
      }

      const toneNames = ['sweet', 'mild', 'spicy'];
      const currentTone = toneNames[toneLevel[0]];
      
      const prompt = `Based on this context: "${contextText}"

Please generate 3 text message reply suggestions with these tones:
1. Sweet (passive, fun, flirty, assuming best intentions)
2. Mild (assertive/neutral, stoic, emotionally intelligent, curious)  
3. Spicy (aggressive, direct, cut-throat, savage, for boundaries or flirty)

Focus on tone level: ${currentTone}

For each reply, also provide a brief "Purposely Perspective" explaining how the reply should land (max 2 sentences, warm and personable).

Format as:
Sweet: [reply text]
Perspective: [explanation]

Mild: [reply text]  
Perspective: [explanation]

Spicy: [reply text]
Perspective: [explanation]

Keep replies concise (max 2 sentences each).`;

      const response = await getFlirtSuggestion(prompt, userProfile);
      
      // Parse the response into structured suggestions
      const suggestions = parseAIResponse(response);
      setReplySuggestions(suggestions);
      
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate reply suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseAIResponse = (response: string): ReplySuggestion[] => {
    // Simple parsing logic - in a real implementation you'd want more robust parsing
    const suggestions: ReplySuggestion[] = [];
    const sections = response.split(/(?=Sweet:|Mild:|Spicy:)/i);
    
    sections.forEach(section => {
      if (section.includes('Sweet:')) {
        const text = section.match(/Sweet:\s*(.+?)(?=Perspective:|$)/s)?.[1]?.trim() || '';
        const perspective = section.match(/Perspective:\s*(.+?)(?=\n\n|$)/s)?.[1]?.trim() || '';
        if (text) suggestions.push({ text, tone: 'sweet', perspective });
      } else if (section.includes('Mild:')) {
        const text = section.match(/Mild:\s*(.+?)(?=Perspective:|$)/s)?.[1]?.trim() || '';
        const perspective = section.match(/Perspective:\s*(.+?)(?=\n\n|$)/s)?.[1]?.trim() || '';
        if (text) suggestions.push({ text, tone: 'mild', perspective });
      } else if (section.includes('Spicy:')) {
        const text = section.match(/Spicy:\s*(.+?)(?=Perspective:|$)/s)?.[1]?.trim() || '';
        const perspective = section.match(/Perspective:\s*(.+?)(?=\n\n|$)/s)?.[1]?.trim() || '';
        if (text) suggestions.push({ text, tone: 'spicy', perspective });
      }
    });

    // Fallback suggestions if parsing fails
    if (suggestions.length === 0) {
      suggestions.push(
        { text: "I appreciate you reaching out! How can we make this work?", tone: 'sweet', perspective: "This response shows warmth while keeping the door open for positive resolution." },
        { text: "I'd like to understand your perspective better. Can we talk?", tone: 'mild', perspective: "This creates space for dialogue while maintaining emotional intelligence." },
        { text: "Let's be direct about what we both need here.", tone: 'spicy', perspective: "This cuts through any ambiguity and demands clear communication." }
      );
    }

    return suggestions;
  };

  const togglePerspective = (index: number) => {
    setExpandedPerspectives(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const retryGeneration = () => {
    generateReplySuggestions();
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Description */}
      <Card className="shadow-soft border-primary/10">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Get perfect text reply suggestions whether you're being flirtatious or firmly setting boundaries. 
            Describe the situation or upload screenshots.
          </p>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card className="shadow-soft border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span>What are you replying to?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="description">Describe the situation</Label>
            <Textarea
              id="description"
              placeholder="Describe the text message you're replying to, the person's tone, or the situation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleImageUpload}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Camera className="w-4 h-4" />
              <span>Upload Screenshots</span>
            </Button>
            
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant="outline"
              size="sm"
              className={`flex items-center space-x-2 ${isRecording ? 'bg-red-50 border-red-200' : ''}`}
            >
              {isRecording ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
              <span>{isRecording ? 'Stop Recording' : 'Voice Input'}</span>
            </Button>
          </div>

          {/* Uploaded Images */}
          {uploadedImages.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Screenshots</Label>
              <div className="flex flex-wrap gap-2">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.dataUrl}
                      alt={`Screenshot ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-border"
                    />
                    <Button
                      onClick={() => removeImage(index)}
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tone Slider */}
      <Card className="shadow-soft border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-primary" />
            <span>Response Tone</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="flex items-center space-x-1">
                <Heart className="w-4 h-4 text-pink-500" />
                <span>Sweet</span>
              </span>
              <span className="flex items-center space-x-1">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span>Mild</span>
              </span>
              <span className="flex items-center space-x-1">
                <Flame className="w-4 h-4 text-red-500" />
                <span>Spicy</span>
              </span>
            </div>
            
            <Slider
              value={toneLevel}
              onValueChange={setToneLevel}
              max={2}
              min={0}
              step={1}
              className="w-full"
            />
            
            <div className="text-center">
              <Badge variant="secondary" className="text-sm">
                Current: {getToneLabel(toneLevel[0])}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button
        onClick={generateReplySuggestions}
        disabled={isProcessing || isLoading}
        variant="romance"
        size="lg"
        className="w-full"
      >
        {isProcessing || isLoading ? (
          <>
            <Wand2 className="w-4 h-4 mr-2 animate-spin" />
            {loadingMessage}
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Reply Suggestions
          </>
        )}
      </Button>

      {/* Loading Progress */}
      {(isProcessing || isLoading) && (
        <Card className="shadow-soft border-primary/10">
          <CardContent className="pt-6">
            <Progress value={undefined} className="w-full" />
            <p className="text-center text-sm text-muted-foreground mt-2">
              {loadingMessage}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reply Suggestions */}
      {replySuggestions.length > 0 && (
        <div className="space-y-4">
          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle className="text-center">Reply Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {replySuggestions.map((suggestion, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getToneEmoji(suggestion.tone)}</span>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.tone.charAt(0).toUpperCase() + suggestion.tone.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-foreground mb-3 leading-relaxed">
                    {suggestion.text}
                  </p>
                  
                  <div className="border-t border-border pt-3">
                    <Button
                      onClick={() => togglePerspective(index)}
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80"
                    >
                      <span className="underline">Why this</span>
                      {expandedPerspectives[index] ? (
                        <ChevronUp className="w-4 h-4 ml-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                    
                    {expandedPerspectives[index] && (
                      <div className="mt-2 p-3 bg-primary/5 rounded-lg">
                        <p className="text-sm text-muted-foreground italic">
                          <strong>Purposely Perspective:</strong> {suggestion.perspective}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Retry Button */}
          <Button
            onClick={retryGeneration}
            variant="outline"
            className="w-full"
            disabled={isProcessing || isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )}
    </div>
  );
};

export default TextGenie;