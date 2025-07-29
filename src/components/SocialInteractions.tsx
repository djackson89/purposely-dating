import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Send, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useSocialInteractions } from '@/hooks/useSocialInteractions';
import { formatDistanceToNow } from 'date-fns';

interface SocialInteractionsProps {
  scenarioIndex: number;
}

const SocialInteractions: React.FC<SocialInteractionsProps> = ({ scenarioIndex }) => {
  const {
    comments,
    socialStats,
    isLoading,
    toggleLike,
    shareScenario,
    addComment,
    toggleCommentLike
  } = useSocialInteractions(scenarioIndex);

  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleDoubleClick = () => {
    toggleLike();
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    await addComment(newComment);
    setNewComment('');
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyContent.trim()) return;
    
    await addComment(replyContent, parentCommentId);
    setReplyContent('');
    setReplyingTo(null);
  };

  const CommentItem: React.FC<{ comment: any; isReply?: boolean }> = ({ comment, isReply = false }) => (
    <div className={`space-y-2 ${isReply ? 'ml-8 pl-4 border-l-2 border-primary/20' : ''}`}>
      <Card className="bg-gradient-soft border-primary/10">
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCommentLike(comment.id)}
              className={`h-auto p-1 ${comment.is_liked_by_user ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <ThumbsUp className={`w-3 h-3 mr-1 ${comment.is_liked_by_user ? 'fill-current' : ''}`} />
              <span className="text-xs">{comment.likes_count || 0}</span>
            </Button>
            
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="h-auto p-1 text-muted-foreground"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                <span className="text-xs">Reply</span>
              </Button>
            )}
          </div>
          
          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyContent.trim()}
                  variant="romance"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply: any) => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Social Stats Bar */}
      <div className="flex items-center justify-between p-3 bg-gradient-soft rounded-lg border border-primary/10">
        <div className="flex items-center space-x-4">
          <button
            onDoubleClick={handleDoubleClick}
            className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <Heart className={`w-4 h-4 ${socialStats.is_liked_by_user ? 'fill-current text-primary' : ''}`} />
            <span className="text-sm">{socialStats.likes_count}</span>
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{socialStats.comments_count}</span>
          </button>
          
          <button
            onClick={shareScenario}
            className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">{socialStats.shares_count}</span>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button
          onClick={toggleLike}
          variant={socialStats.is_liked_by_user ? "romance" : "soft"}
          className="flex-1"
        >
          <Heart className={`w-4 h-4 mr-2 ${socialStats.is_liked_by_user ? 'fill-current' : ''}`} />
          {socialStats.is_liked_by_user ? 'Liked' : 'Like'}
        </Button>
        
        <Button
          onClick={() => setShowComments(!showComments)}
          variant="soft"
          className="flex-1"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Comment
        </Button>
        
        <Button
          onClick={shareScenario}
          variant="soft"
          className="flex-1"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-4">
          {/* Add Comment */}
          <div className="space-y-2">
            <Textarea
              placeholder="Share your thoughts on this scenario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isLoading}
              variant="romance"
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Comments ({socialStats.comments_count})</h4>
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialInteractions;