import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, Mail, MessageCircle, Star, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SupportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SupportDialog: React.FC<SupportDialogProps> = ({ isOpen, onClose }) => {
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFeedbackTypeChange = (type: 'positive' | 'negative') => {
    setFeedbackType(type);
    setRating(0);
    setHoverRating(0);
    setFeedback('');
    setName('');
    setEmail('');
  };

  const handleSubmitPositiveFeedback = async () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "Let us know how many stars you'd give us!",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Save positive feedback to database
      const { error } = await supabase.functions.invoke('send-support-email', {
        body: {
          type: 'feedback',
          name: name || 'Anonymous',
          email: email || 'not-provided@example.com',
          feedback: feedback || `User gave ${rating} stars rating`,
          subject: 'Positive User Feedback',
          rating: rating,
          user_id: user?.id
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Thank you for your feedback! ⭐",
        description: `We appreciate your ${rating}-star rating! Your review helps others discover Purposely.`,
      });
      
      // Reset form
      setFeedbackType(null);
      setRating(0);
      setFeedback('');
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitNegativeFeedback = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Please share your feedback",
        description: "We'd love to know how we can improve!",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send-support-email', {
        body: {
          type: 'feedback',
          name: name || 'Anonymous',
          email: email || 'not-provided@example.com',
          feedback: feedback,
          subject: 'User Feedback - Improvement Suggestions',
          user_id: user?.id
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Feedback sent! 💝",
        description: "Thank you for helping us improve Purposely. We'll review your suggestions carefully.",
      });
      
      // Reset form
      setFeedbackType(null);
      setFeedback('');
      setName('');
      setEmail('');
      onClose();
    } catch (error) {
      toast({
        title: "Error sending feedback",
        description: "Please try again or email us directly at info@thepurposelyapp.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFeedbackType(null);
    setRating(0);
    setHoverRating(0);
    setFeedback('');
    setName('');
    setEmail('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span>Support & Feedback</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!feedbackType && (
            <>
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Mail className="w-5 h-5" />
                    <span>Contact Us</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="font-medium">Email Support:</p>
                    <a 
                      href="mailto:info@thepurposelyapp.com" 
                      className="text-primary hover:underline"
                    >
                      info@thepurposelyapp.com
                    </a>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>We typically respond within 24 hours. For faster support, use the feedback form below!</p>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How's your experience with Purposely so far?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center space-x-8">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleFeedbackTypeChange('positive')}
                      className="flex flex-col items-center space-y-2 h-auto py-4 px-6 hover:bg-green-50 hover:border-green-200"
                    >
                      <ThumbsUp className="w-8 h-8 text-green-600" />
                      <span className="text-sm font-medium">Great!</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleFeedbackTypeChange('negative')}
                      className="flex flex-col items-center space-y-2 h-auto py-4 px-6 hover:bg-red-50 hover:border-red-200"
                    >
                      <ThumbsDown className="w-8 h-8 text-red-600" />
                      <span className="text-sm font-medium">Could be better</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Positive Feedback Form */}
          {feedbackType === 'positive' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-700">We're so glad to hear that! 🎉</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">How many stars would you give Purposely?</Label>
                  <div className="flex justify-center space-x-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-colors"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoverRating || rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="positive-feedback">Share your experience (optional)</Label>
                  <Textarea
                    id="positive-feedback"
                    placeholder="What do you love about Purposely? Your review helps others discover our app!"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setFeedbackType(null)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmitPositiveFeedback}
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Negative Feedback Form */}
          {feedbackType === 'negative' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-orange-700">What can we do to make it better?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="improvement-feedback">Your feedback *</Label>
                  <Textarea
                    id="improvement-feedback"
                    placeholder="Please share what we could improve, any bugs you've encountered, or features you'd like to see..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="feedback-name">Name (optional)</Label>
                    <Input
                      id="feedback-name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedback-email">Email (optional)</Label>
                    <Input
                      id="feedback-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setFeedbackType(null)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmitNegativeFeedback}
                    disabled={isSubmitting || !feedback.trim()}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupportDialog;