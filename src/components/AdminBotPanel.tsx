import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminBots } from '@/hooks/useAdminBots';
import { usePopulateEngagement } from '@/hooks/usePopulateEngagement';
import { Bot, Plus, Send, Settings, Trash2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminBotPanelProps {
  scenarioIndex: number;
}

const AdminBotPanel: React.FC<AdminBotPanelProps> = ({ scenarioIndex }) => {
  const {
    isAdmin,
    botUsers,
    isLoading,
    createBotUser,
    updateBotUser,
    deleteBotUser,
    postBotComment
  } = useAdminBots();

  const { populateEngagement, isPopulating } = usePopulateEngagement();

  const [showCreateBot, setShowCreateBot] = useState(false);
  const [selectedBot, setSelectedBot] = useState<string>('');
  const [botComment, setBotComment] = useState('');
  const [newBotData, setNewBotData] = useState({
    name: '',
    avatar_url: '',
    bio: '',
    personality_traits: {}
  });

  const { toast } = useToast();

  if (!isAdmin) {
    return null; // Don't show anything if not admin
  }

  const handleCreateBot = async () => {
    if (!newBotData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the bot",
        variant: "destructive"
      });
      return;
    }

    const result = await createBotUser(newBotData);
    if (result) {
      setNewBotData({ name: '', avatar_url: '', bio: '', personality_traits: {} });
      setShowCreateBot(false);
    }
  };

  const handlePostBotComment = async () => {
    if (!selectedBot || !botComment.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a bot and enter a comment",
        variant: "destructive"
      });
      return;
    }

    const result = await postBotComment(scenarioIndex, botComment, selectedBot);
    if (result) {
      setBotComment('');
      setSelectedBot('');
    }
  };

  const handleDeleteBot = async (botId: string, botName: string) => {
    if (window.confirm(`Are you sure you want to delete the bot "${botName}"? This action cannot be undone.`)) {
      await deleteBotUser(botId);
    }
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-yellow-800">
          <Settings className="w-5 h-5" />
          <span>Admin Bot Controls</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Populate Section */}
        <div className="space-y-3 bg-yellow-100 p-3 rounded-lg border border-yellow-300">
          <h4 className="font-medium text-yellow-800">Quick Populate Engagement</h4>
          <Button
            onClick={() => populateEngagement(scenarioIndex)}
            disabled={isPopulating}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isPopulating ? 'Adding Comments...' : 'Add 10 Bot Comments + Likes'}
          </Button>
        </div>

        {/* Post as Bot Section */}
        <div className="space-y-3">
          <h4 className="font-medium text-yellow-800">Post Comment as Bot</h4>
          
          <Select value={selectedBot} onValueChange={setSelectedBot}>
            <SelectTrigger className="border-yellow-200">
              <SelectValue placeholder="Select a bot to post as..." />
            </SelectTrigger>
            <SelectContent>
              {botUsers.filter(bot => bot.is_active).map((bot) => (
                <SelectItem key={bot.id} value={bot.id}>
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <span>{bot.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Write a comment as the selected bot..."
            value={botComment}
            onChange={(e) => setBotComment(e.target.value)}
            className="border-yellow-200 min-h-[80px]"
          />

          <Button
            onClick={handlePostBotComment}
            disabled={!selectedBot || !botComment.trim() || isLoading}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Post as Bot
          </Button>
        </div>

        {/* Bot Management Section */}
        <div className="space-y-3 border-t border-yellow-200 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-yellow-800">Manage Bots</h4>
            <Dialog open={showCreateBot} onOpenChange={setShowCreateBot}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Create Bot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Bot User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name</label>
                    <Input
                      placeholder="Bot name..."
                      value={newBotData.name}
                      onChange={(e) => setNewBotData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Avatar URL (optional)</label>
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      value={newBotData.avatar_url}
                      onChange={(e) => setNewBotData(prev => ({ ...prev, avatar_url: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Bio (optional)</label>
                    <Textarea
                      placeholder="Bot description..."
                      value={newBotData.bio}
                      onChange={(e) => setNewBotData(prev => ({ ...prev, bio: e.target.value }))}
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={handleCreateBot}
                      disabled={!newBotData.name.trim() || isLoading}
                      className="flex-1"
                    >
                      Create Bot
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateBot(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Bot List */}
          {botUsers.length > 0 ? (
            <div className="space-y-2">
              {botUsers.map((bot) => (
                <div key={bot.id} className="flex items-center justify-between p-2 bg-white rounded border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium">{bot.name}</span>
                    {!bot.is_active && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteBot(bot.id, bot.name)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-yellow-700 text-center py-4">
              No bots created yet. Create your first bot to start engaging with users!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminBotPanel;