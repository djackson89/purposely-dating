import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

interface BotUser {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  personality_traits: any; // Changed from Record<string, any> to any for JSON compatibility
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useAdminBots = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [botUsers, setBotUsers] = useState<BotUser[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkUserRole();
    if (isAdmin) {
      loadBotUsers();
    }
  }, [isAdmin]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (roles) {
        setUserRoles(roles);
        setIsAdmin(roles.some(role => role.role === 'admin'));
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadBotUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bot_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBotUsers(data || []);
    } catch (error) {
      console.error('Error loading bot users:', error);
      toast({
        title: "Error",
        description: "Failed to load bot users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createBotUser = async (botData: {
    name: string;
    avatar_url?: string;
    bio?: string;
    personality_traits?: Record<string, any>;
  }) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can create bot users",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bot_users')
        .insert({
          ...botData,
          created_by: user.id,
          personality_traits: botData.personality_traits || {}
        })
        .select()
        .single();

      if (error) throw error;

      setBotUsers(prev => [data, ...prev]);
      toast({
        title: "Bot Created",
        description: `Bot user "${botData.name}" has been created successfully`,
      });

      return data;
    } catch (error) {
      console.error('Error creating bot user:', error);
      toast({
        title: "Error",
        description: "Failed to create bot user",
        variant: "destructive"
      });
    }
  };

  const updateBotUser = async (botId: string, updates: Partial<BotUser>) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can update bot users",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bot_users')
        .update(updates)
        .eq('id', botId)
        .select()
        .single();

      if (error) throw error;

      setBotUsers(prev => prev.map(bot => bot.id === botId ? data : bot));
      toast({
        title: "Bot Updated",
        description: "Bot user has been updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating bot user:', error);
      toast({
        title: "Error",
        description: "Failed to update bot user",
        variant: "destructive"
      });
    }
  };

  const deleteBotUser = async (botId: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can delete bot users",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('bot_users')
        .delete()
        .eq('id', botId);

      if (error) throw error;

      setBotUsers(prev => prev.filter(bot => bot.id !== botId));
      toast({
        title: "Bot Deleted",
        description: "Bot user has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting bot user:', error);
      toast({
        title: "Error",
        description: "Failed to delete bot user",
        variant: "destructive"
      });
    }
  };

  const postBotComment = async (
    scenarioIndex: number,
    content: string,
    botId: string,
    parentCommentId?: string
  ) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can post as bot users",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('scenario_comments')
        .insert({
          scenario_index: scenarioIndex,
          content,
          bot_user_id: botId,
          user_id: null, // Explicitly set to null since we're using bot_user_id
          parent_comment_id: parentCommentId || null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Comment Posted",
        description: "Bot comment has been posted successfully",
      });

      return data;
    } catch (error) {
      console.error('Error posting bot comment:', error);
      toast({
        title: "Error",
        description: "Failed to post bot comment",
        variant: "destructive"
      });
    }
  };

  const assignUserRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can assign roles",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Role Assigned",
        description: `User has been assigned the ${role} role`,
      });

      return data;
    } catch (error) {
      console.error('Error assigning user role:', error);
      toast({
        title: "Error",
        description: "Failed to assign user role",
        variant: "destructive"
      });
    }
  };

  return {
    isAdmin,
    userRoles,
    botUsers,
    isLoading,
    createBotUser,
    updateBotUser,
    deleteBotUser,
    postBotComment,
    assignUserRole,
    refreshBotUsers: loadBotUsers,
    refreshUserRole: checkUserRole
  };
};