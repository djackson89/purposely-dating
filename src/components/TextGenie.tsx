import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
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
  Flame,
  Copy,
  Send
} from 'lucide-react';
import { useCamera, PhotoResult } from '@/hooks/useCamera';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

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

interface UploadedImage {
  dataUrl: string;
  file?: File;
}

const TextGenie: React.FC<TextGenieProps> = ({ userProfile }) => {
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [replySuggestions, setReplySuggestions] = useState<ReplySuggestion[]>([]);
  const [expandedPerspectives, setExpandedPerspectives] = useState<{ [key: number]: boolean }>({});
  const [loadingMessage, setLoadingMessage] = useState('');
  const [imageAnalysis, setImageAnalysis] = useState<string>('');
  const [isAnalyzingImages, setIsAnalyzingImages] = useState(false);
  const [purposelyPerspective, setPurposelyPerspective] = useState<string>('');
  const [isGeneratingPerspective, setIsGeneratingPerspective] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { selectPhoto } = useCamera();
  const { getFlirtSuggestion, getAIResponse, isLoading } = useRelationshipAI();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Memoized constants to prevent recreation
  const loadingMessages = useMemo(() => [
    "Generating personalized suggestions...",
    "Analyzing conversation context...",
    "Creating perfect replies..."
  ], []);

  useEffect(() => {
    if (isProcessing) {
      const messageIndex = Math.floor(Math.random() * loadingMessages.length);
      setLoadingMessage(loadingMessages[messageIndex]);
    }
  }, [isProcessing]);

  // Optimized helper functions with useCallback
  const getToneLabel = useCallback((level: number) => {
    switch (level) {
      case 0: return 'Sweet';
      case 1: return 'Mild';  
      case 2: return 'Spicy';
      default: return 'Mild';
    }
  }, []);

  const getToneEmoji = useCallback((tone: 'sweet' | 'mild' | 'spicy') => {
    switch (tone) {
      case 'sweet': return '💕';
      case 'mild': return '💭';
      case 'spicy': return '🔥';
    }
  }, []);

  const handleImageUpload = useCallback(async () => {
    if (uploadedImages.length >= 6) {
      toast({
        title: "Maximum reached",
        description: "You can upload up to 6 screenshots maximum.",
        variant: "destructive",
      });
      return;
    }

    // Use file input for multiple image selection
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [uploadedImages.length, toast]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const remainingSlots = 6 - uploadedImages.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    if (filesToProcess.length < files.length) {
      toast({
        title: "Some files skipped",
        description: `Only ${remainingSlots} screenshots can be added. Maximum is 6 total.`,
      });
    }

    const newImages: UploadedImage[] = [];
    
    for (const file of filesToProcess) {
      if (file.type.startsWith('image/')) {
        const dataUrl = await convertFileToDataUrl(file);
        newImages.push({
          dataUrl,
          file
        });
      }
    }

    setUploadedImages(prev => [...prev, ...newImages]);
    
    if (newImages.length > 0) {
      toast({
        title: `${newImages.length} image(s) uploaded`,
        description: "Ready to analyze your screenshots!",
      });
    }

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadedImages.length, toast]);

  const convertFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const analyzeScreenshots = async (images: UploadedImage[]): Promise<string> => {
    if (images.length === 0) return '';

    setIsAnalyzingImages(true);
    try {
      console.log('Analyzing screenshots with AI...');
      
      // Convert images to base64 strings
      const imageDataUrls = images.map(img => img.dataUrl);
      
      const { data, error } = await supabase.functions.invoke('analyze-screenshots', {
        body: {
          images: imageDataUrls,
          context: description,
          userProfile: userProfile
        }
      });

      if (error) {
        console.error('Screenshot analysis error:', error);
        throw new Error(error.message || 'Failed to analyze screenshots');
      }

      if (!data.success) {
        throw new Error(data.error || 'Screenshot analysis failed');
      }

      console.log('Screenshot analysis completed');
      return data.analysis || '';
      
    } catch (error) {
      console.error('Error analyzing screenshots:', error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze screenshots. Please try again.",
        variant: "destructive",
      });
      return '';
    } finally {
      setIsAnalyzingImages(false);
    }
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

  const generateReplySuggestions = async (isRetryAction = false) => {
    if (!description.trim() && uploadedImages.length === 0) {
      toast({
        title: "Input required",
        description: "Please provide a description or upload screenshots.",
        variant: "destructive",
      });
      return;
    }

    if (isRetryAction) {
      setIsRetrying(true);
    } else {
      setIsProcessing(true);
    }
    
    try {
      let contextText = description;
      
      // Analyze screenshots if any and not already analyzed
      if (uploadedImages.length > 0 && !imageAnalysis) {
        const screenshotAnalysis = await analyzeScreenshots(uploadedImages);
        setImageAnalysis(screenshotAnalysis);
        contextText += (contextText ? '\n\n' : '') + `Screenshot Analysis:\n${screenshotAnalysis}`;
      } else if (imageAnalysis) {
        contextText += (contextText ? '\n\n' : '') + `Screenshot Analysis:\n${imageAnalysis}`;
      }

      // First, get the Purposely Perspective using therapy mode
      const perspectivePrompt = `Analyze this message/situation and explain why the toxic implications are detrimental. Focus on what this behavior indicates about his character, emotional maturity, and viability as a long-term partner. Keep it to 2-3 sentences max: ${contextText}`;
      const perspective = await getAIResponse(perspectivePrompt, userProfile, 'therapy');
      setPurposelyPerspective(perspective.trim());

      // Generate three different response types using appropriate AI modes
      const suggestions: ReplySuggestion[] = [];
      
      // Sweet response - Use flirt mode for warm, tactful responses
      const sweetPrompt = `Generate a Sweet response to this situation as if I am speaking directly to the person. Write in first person as if I am sending this message myself. Be warm, presuming innocence, extremely tactful, and agreeable. Keep it under 2 sentences. Write as if I am talking directly to them: ${contextText}`;
      const sweetResponse = await getAIResponse(sweetPrompt, userProfile, 'flirt');
      suggestions.push({
        text: sweetResponse.trim().replace(/^["']|["']$/g, '').replace(/\*/g, ''),
        tone: 'sweet',
        perspective: "This response presumes positive intent and maintains warmth while addressing the situation."
      });

      // Mild response - Use therapy mode for direct, revealing questions
      const mildPrompt = `Generate a Mild response to this situation as if I am speaking directly to the person. Write in first person as if I am sending this message myself. Be very direct without being disrespectful. Ask hard questions that reveal definitive intentions or reword as a question for more context. No generic phrases like "can we discuss". Keep it under 2 sentences. Write as if I am talking directly to them: ${contextText}`;
      const mildResponse = await getAIResponse(mildPrompt, userProfile, 'therapy');
      suggestions.push({
        text: mildResponse.trim().replace(/^["']|["']$/g, '').replace(/\*/g, ''),
        tone: 'mild',
        perspective: "This response directly addresses the situation and seeks clarity about intentions."
      });

      // Spicy response - Use therapy mode for boundary-setting
      const spicyPrompt = `Generate a Spicy response to this situation as if I am speaking directly to the person. Write in first person as if I am sending this message myself. Set hard boundaries or expectations with a gut punch feel. Unless the text is clearly positive/flirtatious, be direct about boundaries. Keep it under 2 sentences. Write as if I am talking directly to them: ${contextText}`;
      const spicyResponse = await getAIResponse(spicyPrompt, userProfile, 'therapy');
      suggestions.push({
        text: spicyResponse.trim().replace(/^["']|["']$/g, '').replace(/\*/g, ''),
        tone: 'spicy',
        perspective: "This response establishes clear boundaries and expectations without compromise."
      });

      setReplySuggestions(suggestions);
      
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate reply suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (isRetryAction) {
        setIsRetrying(false);
      } else {
        setIsProcessing(false);
      }
    }
  };

  const parseAIResponse = (response: string): ReplySuggestion[] => {
    // Simple parsing logic - in a real implementation you'd want more robust parsing
    const suggestions: ReplySuggestion[] = [];
    const sections = response.split(/(?=Sweet:|Mild:|Spicy:)/i);
    
    sections.forEach(section => {
      if (section.includes('Sweet:')) {
        let text = section.match(/Sweet:\s*(.+?)(?=Perspective:|$)/s)?.[1]?.trim() || '';
        const perspective = section.match(/Perspective:\s*(.+?)(?=\n\n|$)/s)?.[1]?.trim() || '';
        // Remove quotation marks and asterisks from the text
        text = text.replace(/^["']|["']$/g, '').replace(/\*/g, '');
        if (text) suggestions.push({ text, tone: 'sweet', perspective });
      } else if (section.includes('Mild:')) {
        let text = section.match(/Mild:\s*(.+?)(?=Perspective:|$)/s)?.[1]?.trim() || '';
        const perspective = section.match(/Perspective:\s*(.+?)(?=\n\n|$)/s)?.[1]?.trim() || '';
        // Remove quotation marks and asterisks from the text
        text = text.replace(/^["']|["']$/g, '').replace(/\*/g, '');
        if (text) suggestions.push({ text, tone: 'mild', perspective });
      } else if (section.includes('Spicy:')) {
        let text = section.match(/Spicy:\s*(.+?)(?=Perspective:|$)/s)?.[1]?.trim() || '';
        const perspective = section.match(/Perspective:\s*(.+?)(?=\n\n|$)/s)?.[1]?.trim() || '';
        // Remove quotation marks and asterisks from the text
        text = text.replace(/^["']|["']$/g, '').replace(/\*/g, '');
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
    generateReplySuggestions(true);
  };

  const generateNewPerspective = async () => {
    if (!description.trim() && uploadedImages.length === 0) {
      return;
    }

    setIsGeneratingPerspective(true);
    
    try {
      let contextText = description;
      if (imageAnalysis) {
        contextText += (contextText ? '\n\n' : '') + `Screenshot Analysis:\n${imageAnalysis}`;
      }

      const newPerspectivePrompt = `The user wants a different perspective on this situation. Analyze the toxic implications from a different angle and explain what this behavior indicates about his character, emotional maturity, and viability as a long-term partner: ${contextText}

Your new response should:
- Examine different red flags or manipulation tactics than previously identified
- Focus on what this reveals about his long-term relationship potential
- Explain why this behavior pattern is detrimental to healthy relationships
- Address his emotional intelligence and capacity for growth
- Keep it to 2-3 sentences maximum
- Use direct, protective language about relationship standards

Provide a fresh analytical perspective on why this behavior is problematic for long-term partnership.`;

      const newPerspective = await getFlirtSuggestion(newPerspectivePrompt, userProfile);
      setPurposelyPerspective(newPerspective.trim());
      
    } catch (error) {
      console.error('Error generating new perspective:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate new perspective. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPerspective(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Reply copied to clipboard",
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Copied!",
        description: "Reply copied to clipboard",
      });
    }
  };

  const shareText = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: text,
        });
      } catch (error) {
        // User cancelled or sharing failed, fallback to copy
        await copyToClipboard(text);
      }
    } else {
      // Fallback to copy if Web Share API is not available
      await copyToClipboard(text);
    }
  };

  const handleReplyInteraction = (text: string, action: 'copy' | 'share') => {
    if (action === 'copy') {
      copyToClipboard(text);
    } else {
      shareText(text);
    }
  };

  return (
    <div className="space-y-6">

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
              disabled={uploadedImages.length >= 6}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Screenshots ({uploadedImages.length}/6)</span>
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

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Uploaded Images */}
          {uploadedImages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Uploaded Screenshots ({uploadedImages.length}/6)</Label>
                {uploadedImages.length === 6 && (
                  <Badge variant="secondary" className="text-xs">Maximum reached</Badge>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.dataUrl}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-border"
                    />
                    <Button
                      onClick={() => removeImage(index)}
                      variant="destructive"
                      size="sm"
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </Button>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
              {isAnalyzingImages && (
                <div className="text-center text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 inline animate-spin mr-2" />
                  Analyzing screenshots...
                </div>
              )}
            </div>
          )}
          {/* Image Analysis Results */}
          {imageAnalysis && (
            <div className="space-y-2">
              <Label>Screenshot Analysis</Label>
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{imageAnalysis}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button
        onClick={() => generateReplySuggestions()}
        disabled={isProcessing || isLoading || isAnalyzingImages}
        variant="romance"
        size="lg"
        className="w-full"
      >
        {isProcessing || isLoading || isAnalyzingImages ? (
          <>
            <Wand2 className="w-4 h-4 mr-2 animate-spin" />
            {isAnalyzingImages ? 'Analyzing screenshots...' : loadingMessage}
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Reply Suggestions
          </>
        )}
      </Button>

      {/* Loading Progress */}
      {(isProcessing || isLoading || isAnalyzingImages) && (
        <Card className="shadow-soft border-primary/10">
          <CardContent className="pt-6">
            <Progress value={undefined} className="w-full" />
            <p className="text-center text-sm text-muted-foreground mt-2">
              {isAnalyzingImages ? 'Analyzing screenshots...' : loadingMessage}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Purposely Perspective */}
      {purposelyPerspective && (
        <Card className="shadow-soft border-primary/10">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center space-x-2">
              <Heart className="w-5 h-5 text-primary" />
              <span>Purposely Perspective</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-foreground leading-relaxed mb-4">
                {purposelyPerspective}
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                  onClick={generateNewPerspective}
                  disabled={isGeneratingPerspective}
                >
                  <span>{isGeneratingPerspective ? 'Loading...' : 'See More'}</span>
                </Button>
                <Button
                  variant="romance"
                  size="sm"
                  className="flex items-center space-x-2"
                  onClick={() => {
                    // This could navigate to a dedicated Q&A section in the future
                    toast({
                      title: "Coming Soon!",
                      description: "Ask Purposely feature will be available soon.",
                    });
                  }}
                >
                  <span>Ask Purposely</span>
                </Button>
              </div>
            </div>
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
                     <div className="flex items-center space-x-2">
                       {/* Copy button for web, hidden on mobile */}
                       {!isMobile && (
                         <Button
                           onClick={() => handleReplyInteraction(suggestion.text, 'copy')}
                           variant="ghost"
                           size="sm"
                           className="p-2 hover:bg-muted"
                         >
                           <Copy className="w-4 h-4" />
                         </Button>
                       )}
                       {/* Share button */}
                       <Button
                         onClick={() => handleReplyInteraction(suggestion.text, 'share')}
                         variant="ghost"
                         size="sm"
                         className="p-2 hover:bg-muted"
                       >
                         <Send className="w-4 h-4" />
                       </Button>
                     </div>
                   </div>
                   
                   <p 
                     className="text-foreground mb-3 leading-relaxed cursor-pointer select-text"
                     onTouchStart={isMobile ? () => {
                       // For mobile: long press to copy
                       let timeout = setTimeout(() => {
                         handleReplyInteraction(suggestion.text, 'copy');
                       }, 800);
                       
                       const cleanup = () => {
                         clearTimeout(timeout);
                         document.removeEventListener('touchend', cleanup);
                         document.removeEventListener('touchmove', cleanup);
                       };
                       
                       document.addEventListener('touchend', cleanup);
                       document.addEventListener('touchmove', cleanup);
                     } : undefined}
                   >
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

          {/* Try Again Button */}
          <Button
            onClick={retryGeneration}
            variant="romance"
            className="w-full"
            disabled={isProcessing || isLoading || isAnalyzingImages || isRetrying}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Generating...' : 'Try Again'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default React.memo(TextGenie);