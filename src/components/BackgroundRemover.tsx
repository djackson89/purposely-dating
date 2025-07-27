import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';
import { Download, Upload, Loader2 } from 'lucide-react';

export const BackgroundRemover: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setOriginalImage(URL.createObjectURL(file));
      
      const imageElement = await loadImage(file);
      const processedBlob = await removeBackground(imageElement);
      const processedUrl = URL.createObjectURL(processedBlob);
      
      setProcessedImage(processedUrl);
      
      toast({
        title: "Success!",
        description: "Background removed successfully. Click download to save.",
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Processing failed",
        description: "Failed to remove background. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'purposely-app-icon-no-bg.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Remove Background from App Icon</h2>
        <p className="text-muted-foreground">
          Upload your app icon with grey background to remove it automatically
        </p>
      </div>

      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload App Icon
        </Button>

        {isProcessing && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mr-2" />
            <span>Processing image...</span>
          </div>
        )}

        {originalImage && !isProcessing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Original</h3>
              <img 
                src={originalImage} 
                alt="Original" 
                className="w-full max-w-xs mx-auto rounded-lg border"
              />
            </div>
            
            {processedImage && (
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Background Removed</h3>
                <img 
                  src={processedImage} 
                  alt="Processed" 
                  className="w-full max-w-xs mx-auto rounded-lg border"
                  style={{ backgroundColor: '#f0f0f0' }}
                />
                <Button onClick={handleDownload} className="mt-2">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};