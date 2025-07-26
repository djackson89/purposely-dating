import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Camera, Edit, Heart, Calendar, MessageCircle, LogOut, Settings } from 'lucide-react';
import { FTUETooltip } from '@/components/ui/ftue-tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { useCamera } from '@/hooks/useCamera';
import { useHaptics } from '@/hooks/useHaptics';
import AppSettings from '@/components/AppSettings';

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
  const { toast } = useToast();
  const { selectPhoto } = useCamera();
  const { success, light } = useHaptics();

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

  const profileStats = [
    { icon: Heart, label: 'Challenges Completed', value: '12' },
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
          <FTUETooltip
            id="profile"
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
          <Button variant="soft" className="w-full justify-start">
            Privacy Settings
          </Button>
          <Button variant="soft" className="w-full justify-start">
            About & Support
          </Button>
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