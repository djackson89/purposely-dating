import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  user_id: string | null;
  bot_user_id: string | null;
  scenario_index: number;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
  likes_count: number;
  is_liked_by_user: boolean;
  bot_user?: {
    name: string;
    avatar_url?: string;
    bio?: string;
  };
}

interface SocialStats {
  likes_count: number;
  shares_count: number;
  comments_count: number;
  is_liked_by_user: boolean;
}

export const useSocialInteractions = (scenarioIndex: number) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [socialStats, setSocialStats] = useState<SocialStats>({
    likes_count: 0,
    shares_count: 0,
    comments_count: 0,
    is_liked_by_user: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load social data
  useEffect(() => {
    loadSocialData();
  }, [scenarioIndex]);

  const loadSocialData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Load interactions stats
      const { data: interactions } = await supabase
        .from('scenario_interactions')
        .select('interaction_type')
        .eq('scenario_index', scenarioIndex);

      // Load comments with likes count and bot user data
      const { data: commentsData } = await supabase
        .from('scenario_comments')
        .select(`
          *,
          comment_likes(count),
          bot_users(name, avatar_url, bio)
        `)
        .eq('scenario_index', scenarioIndex)
        .order('created_at', { ascending: true });

      // Check if current user liked the scenario
      let isLikedByUser = false;
      if (user) {
        const { data: userLike } = await supabase
          .from('scenario_interactions')
          .select('id')
          .eq('scenario_index', scenarioIndex)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like')
          .single();
        
        isLikedByUser = !!userLike;
      }

      // Process interactions
      const likes = interactions?.filter(i => i.interaction_type === 'like').length || 0;
      const shares = interactions?.filter(i => i.interaction_type === 'share').length || 0;

      setSocialStats({
        likes_count: likes,
        shares_count: shares,
        comments_count: commentsData?.length || 0,
        is_liked_by_user: isLikedByUser
      });

      // Process comments with nested structure
      if (commentsData) {
        const processedComments = await processCommentsWithLikes(commentsData, user?.id);
        setComments(processedComments);
      }

    } catch (error) {
      console.error('Error loading social data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processCommentsWithLikes = async (commentsData: any[], userId?: string) => {
    // Check which comments the user has liked
    let userLikes: string[] = [];
    if (userId) {
      const { data: likesData } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', userId);
      
      userLikes = likesData?.map(like => like.comment_id) || [];
    }

    const commentsMap = new Map();
    const rootComments: Comment[] = [];

    // Process each comment
    commentsData.forEach((comment: any) => {
      const processedComment: Comment = {
        ...comment,
        likes_count: comment.comment_likes?.[0]?.count || 0,
        is_liked_by_user: userLikes.includes(comment.id),
        replies: []
      };

      commentsMap.set(comment.id, processedComment);

      if (comment.parent_comment_id) {
        // This is a reply
        const parent = commentsMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(processedComment);
        }
      } else {
        // This is a root comment
        rootComments.push(processedComment);
      }
    });

    return rootComments;
  };

  const toggleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to like scenarios",
          variant: "destructive"
        });
        return;
      }

      if (socialStats.is_liked_by_user) {
        // Unlike
        await supabase
          .from('scenario_interactions')
          .delete()
          .eq('scenario_index', scenarioIndex)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like');

        setSocialStats(prev => ({
          ...prev,
          likes_count: prev.likes_count - 1,
          is_liked_by_user: false
        }));
      } else {
        // Like
        await supabase
          .from('scenario_interactions')
          .insert({
            scenario_index: scenarioIndex,
            user_id: user.id,
            interaction_type: 'like'
          });

        setSocialStats(prev => ({
          ...prev,
          likes_count: prev.likes_count + 1,
          is_liked_by_user: true
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
  };

  const shareScenario = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to share scenarios",
          variant: "destructive"
        });
        return;
      }

      await supabase
        .from('scenario_interactions')
        .insert({
          scenario_index: scenarioIndex,
          user_id: user.id,
          interaction_type: 'share'
        });

      setSocialStats(prev => ({
        ...prev,
        shares_count: prev.shares_count + 1
      }));

      // Trigger native share if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Purposely Dating App - Relationship Advice',
            text: 'Check out this relationship advice from Purposely!',
            url: window.location.origin,
          });
        } catch (error) {
          console.log('Native share cancelled or failed');
        }
      } else {
        navigator.clipboard.writeText(window.location.origin);
        toast({
          title: "Link Copied!",
          description: "Share this relationship advice with your friends!",
        });
      }
    } catch (error) {
      console.error('Error sharing scenario:', error);
      toast({
        title: "Error",
        description: "Failed to share scenario",
        variant: "destructive"
      });
    }
  };

  const addComment = async (content: string, parentCommentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to comment",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('scenario_comments')
        .insert({
          scenario_index: scenarioIndex,
          user_id: user.id,
          content,
          parent_comment_id: parentCommentId || null
        })
        .select()
        .single();

      if (error) throw error;

      // Reload comments to get the updated structure
      await loadSocialData();

      toast({
        title: "Comment added!",
        description: "Your comment has been posted successfully",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to like comments",
          variant: "destructive"
        });
        return;
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          });
      }

      // Reload comments to update like counts
      await loadSocialData();
    } catch (error) {
      console.error('Error toggling comment like:', error);
      toast({
        title: "Error",
        description: "Failed to update comment like",
        variant: "destructive"
      });
    }
  };

  return {
    comments,
    socialStats,
    isLoading,
    toggleLike,
    shareScenario,
    addComment,
    toggleCommentLike,
    refreshData: loadSocialData
  };
};