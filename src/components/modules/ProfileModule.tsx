import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Camera, Edit, Heart, Calendar, MessageCircle, LogOut, Settings, CreditCard, RefreshCw } from 'lucide-react';
import { HeartIcon } from '@/components/ui/heart-icon';
import { InfoDialog } from '@/components/ui/info-dialog';
import { AboutDialog } from '@/components/ui/about-dialog';
import { PrivacyPolicyDialog } from '@/components/ui/privacy-policy-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useCamera } from '@/hooks/useCamera';
import { useHaptics } from '@/hooks/useHaptics';
import { useSubscription } from '@/hooks/useSubscription';
import AppSettings from '@/components/AppSettings';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface ProfileModuleProps {
  userProfile: OnboardingData;
  onProfileUpdate: (data: OnboardingData) => void;
}

const ProfileModule: React.FC<ProfileModuleProps> = ({ userProfile, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(userProfile);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState('Your Name');
  const [showSettings, setShowSettings] = useState(false);
  const { user, signOut } = useAuth();
  const { subscription, openCustomerPortal, createCheckoutSession } = useSubscription();
  const { toast } = useToast();
  const { selectPhoto } = useCamera();
  const { success, light } = useHaptics();

  // Admin stats state
  const [adminStats, setAdminStats] = useState<{ totalUsers: number; todaySignups: number } | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const fetchAdminStats = async () => {
    if (!user) return;
    setAdminLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-stats');
      if (error || !data) {
        setIsAdmin(false);
        setAdminStats(null);
      } else {
        setIsAdmin(true);
        setAdminStats({ totalUsers: data.total_users, todaySignups: data.today_signups_cst });
      }
    } catch (e) {
      setIsAdmin(false);
      setAdminStats(null);
    } finally {
      setAdminLoading(false);
    }
  };

  const msUntilNextChicagoMidnight = () => {
    const now = new Date();
    const chicagoNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const tzOffsetMs = now.getTime() - chicagoNow.getTime();
    const chicagoMidnightLocal = new Date(
      chicagoNow.getFullYear(),
      chicagoNow.getMonth(),
      chicagoNow.getDate() + 1,
      0, 0, 0, 0
    );
    const chicagoMidnightUtcMs = chicagoMidnightLocal.getTime() + tzOffsetMs;
    return Math.max(chicagoMidnightUtcMs - now.getTime(), 0);
  };

  useEffect(() => {
    fetchAdminStats();
    const timeout = setTimeout(() => {
      fetchAdminStats();
      const interval = setInterval(fetchAdminStats, 24 * 60 * 60 * 1000);
      // store interval on window to ensure cleanup is handled on reloads
      // @ts-ignore
      window.__adminStatsInterval && clearInterval(window.__adminStatsInterval);
      // @ts-ignore
      window.__adminStatsInterval = interval;
    }, msUntilNextChicagoMidnight());
    return () => {
      clearTimeout(timeout);
      // @ts-ignore
      window.__adminStatsInterval && clearInterval(window.__adminStatsInterval);
    };
  }, [user]);

  const handleSaveProfile = () => {
    onProfileUpdate(editedProfile);
    setIsEditing(false);
    success(); // Haptic feedback for successful save
    toast({
      title: "Profile Updated",
      description: "Your profile has been saved successfully.",
    });
  };

  const handleImageUpload = async () => {
    light(); // Light haptic feedback on button press
    
    const photo = await selectPhoto();
    if (photo) {
      setProfileImage(photo.dataUrl);
      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated.",
      });
    }
  };

  const handleSignOut = async () => {
    light(); // Haptic feedback on button press
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You've been successfully signed out.",
      });
    }
  };

  const handleManageBilling = async () => {
    light(); // Haptic feedback on button press
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const profileStats = [
    { icon: HeartIcon, label: 'Challenges Completed', value: '12' },
    { icon: Calendar, label: 'Date Ideas Saved', value: '8' },
    { icon: MessageCircle, label: 'Journal Entries', value: '15' }
  ];

  return (
    <div className="pb-20 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <h1 className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
            Profile 💕
          </h1>
          <InfoDialog
            title="Profile"
            description="Track your growth, celebrate your progress, and personalize your Purposely Dating experience."
          />
        </div>
        <p className="text-muted-foreground">Your relationship journey</p>
      </div>

      {/* Profile Picture & Name */}
      <Card className="shadow-romance border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-glow">
                <AvatarImage src={profileImage || undefined} alt="Profile" />
                <AvatarFallback className="bg-gradient-romance text-white text-2xl">
                  {userName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={handleImageUpload}
                className="absolute bottom-0 right-0 bg-primary rounded-full p-2 hover:bg-primary/90 transition-colors shadow-lg"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <div className="text-center space-y-2">
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="text-center text-xl font-semibold border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <p className="text-sm text-muted-foreground">
                {userProfile.age} • {userProfile.relationshipStatus}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="shadow-soft border-primary/10">
        <CardHeader>
          <CardTitle className="text-center">Your Journey Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {profileStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center space-y-2">
                  <div className="mx-auto w-10 h-10 bg-gradient-romance rounded-full flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card className="shadow-soft border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-primary" />
            <span>Profile Settings</span>
          </CardTitle>
          <Button
            variant="soft"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="w-4 h-4 mr-1" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Love Language</Label>
              {isEditing ? (
                <select
                  value={editedProfile.loveLanguage}
                  onChange={(e) => setEditedProfile({...editedProfile, loveLanguage: e.target.value})}
                  className="w-full mt-1 p-2 border border-primary/20 rounded-md focus:border-primary focus:ring-0"
                >
                  <option value="Words of Affirmation">Words of Affirmation</option>
                  <option value="Quality Time">Quality Time</option>
                  <option value="Physical Touch">Physical Touch</option>
                  <option value="Acts of Service">Acts of Service</option>
                  <option value="Receiving Gifts">Receiving Gifts</option>
                </select>
              ) : (
                <p className="text-foreground mt-1">{userProfile.loveLanguage}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Relationship Status</Label>
              {isEditing ? (
                <select
                  value={editedProfile.relationshipStatus}
                  onChange={(e) => setEditedProfile({...editedProfile, relationshipStatus: e.target.value})}
                  className="w-full mt-1 p-2 border border-primary/20 rounded-md focus:border-primary focus:ring-0"
                >
                  <option value="Dating">Dating</option>
                  <option value="In a Relationship">In a Relationship</option>
                  <option value="Married">Married</option>
                </select>
              ) : (
                <p className="text-foreground mt-1">{userProfile.relationshipStatus}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Age Range</Label>
              {isEditing ? (
                <select
                  value={editedProfile.age}
                  onChange={(e) => setEditedProfile({...editedProfile, age: e.target.value})}
                  className="w-full mt-1 p-2 border border-primary/20 rounded-md focus:border-primary focus:ring-0"
                >
                  <option value="18-24">18-24</option>
                  <option value="25-34">25-34</option>
                  <option value="35-44">35-44</option>
                  <option value="45+">45+</option>
                </select>
              ) : (
                <p className="text-foreground mt-1">{userProfile.age}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Personality Type</Label>
              {isEditing ? (
                <select
                  value={editedProfile.personalityType}
                  onChange={(e) => setEditedProfile({...editedProfile, personalityType: e.target.value})}
                  className="w-full mt-1 p-2 border border-primary/20 rounded-md focus:border-primary focus:ring-0"
                >
                  <option value="Outgoing & Social (Extrovert)">Outgoing & Social (Extrovert)</option>
                  <option value="Thoughtful & Introspective (Introvert)">Thoughtful & Introspective (Introvert)</option>
                  <option value="Balanced Mix of Both">Balanced Mix of Both</option>
                  <option value="Adventurous & Spontaneous">Adventurous & Spontaneous</option>
                  <option value="Calm & Steady">Calm & Steady</option>
                </select>
              ) : (
                <p className="text-foreground mt-1">{userProfile.personalityType}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex space-x-3 pt-4">
              <Button
                variant="romance"
                onClick={handleSaveProfile}
                className="flex-1"
              >
                Save Changes 💕
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Management */}
      <Card className="shadow-soft border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <span>Subscription & Billing</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription.subscribed ? (
            <>
              <div className="bg-gradient-soft p-4 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-primary">Current Plan</h3>
                  <span className="bg-gradient-romance text-white px-3 py-1 rounded-full text-sm font-medium">
                    {subscription.is_trial ? 'Free Trial' : 'Premium Access'}{subscription.subscription_tier ? ` • ${subscription.subscription_tier}` : ''}
                  </span>
                </div>
                {subscription.subscription_end && (
                  <p className="text-sm text-muted-foreground">
                    {subscription.is_trial ? 'Trial ends:' : 'Renews:'} {new Date(subscription.subscription_end).toLocaleDateString()}
                  </p>
                )}
                {subscription.has_intimacy_addon && (
                  <p className="text-xs text-muted-foreground mt-1">18+ Intimacy add‑on active</p>
                )}
              </div>
              <Button 
                variant="soft" 
                className="w-full justify-start"
                onClick={handleManageBilling}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Subscription & Billing
              </Button>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Update payment methods</p>
                <p>• Change or upgrade your plan</p>
                <p>• View billing history</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gradient-soft p-4 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-primary">Current Plan</h3>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">Free</span>
                </div>
                <p className="text-sm text-muted-foreground">Unlock all features with Premium Access.</p>
              </div>
              <Button 
                variant="romance" 
                className="w-full"
                onClick={() => createCheckoutSession('yearly', true)}
              >
                Go Premium
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="shadow-soft border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <User className="w-5 h-5 text-primary" />
                <span>Admin Analytics</span>
              </span>
              <Button variant="soft" size="sm" onClick={fetchAdminStats} disabled={adminLoading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${adminLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-soft p-4 rounded-lg border border-primary/20">
                <div className="text-sm text-muted-foreground">Total users</div>
                <div className="text-2xl font-bold text-primary">{adminStats ? adminStats.totalUsers : '—'}</div>
              </div>
              <div className="bg-gradient-soft p-4 rounded-lg border border-primary/20">
                <div className="text-sm text-muted-foreground">Signups today (CST)</div>
                <div className="text-2xl font-bold text-primary">{adminStats ? adminStats.todaySignups : '—'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* App Info */}
      <Card className="shadow-soft border-primary/10">
        <CardHeader>
          <CardTitle>App Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="soft" 
            className="w-full justify-start"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Device & App Settings
          </Button>
          <PrivacyPolicyDialog />
          <AboutDialog />
          <Button 
            variant="destructive" 
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
          <div className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              User: {user?.email}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Settings Modal */}
      {showSettings && <AppSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default ProfileModule;