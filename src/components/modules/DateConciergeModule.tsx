import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Sparkles, Heart, Users, Coffee } from 'lucide-react';
import { FTUETooltip } from '@/components/ui/ftue-tooltip';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface DateConciergeModuleProps {
  userProfile: OnboardingData;
}

const DateConciergeModule: React.FC<DateConciergeModuleProps> = ({ userProfile }) => {
  const [activeSection, setActiveSection] = useState<'suggestions' | 'local' | 'planning'>('suggestions');
  
  // AI-powered date suggestions based on user profile
  const getPersonalizedDates = () => {
    const baseIdeas = [
      {
        name: "Cozy Coffee & Deep Conversation",
        description: "Find a quiet café with comfortable seating for meaningful talks",
        budget: "Low",
        mood: ["Intimate", "Relaxed"],
        loveLanguageMatch: ["Words of Affirmation", "Quality Time"],
        icon: Coffee
      },
      {
        name: "Sunset Picnic Adventure", 
        description: "Pack favorite foods and watch the sunset together",
        budget: "Medium",
        mood: ["Romantic", "Outdoor"],
        loveLanguageMatch: ["Quality Time", "Acts of Service"],
        icon: Heart
      },
      {
        name: "Local Art Gallery Stroll",
        description: "Explore creativity together and discuss what you see",
        budget: "Medium", 
        mood: ["Cultural", "Thoughtful"],
        loveLanguageMatch: ["Quality Time", "Words of Affirmation"],
        icon: Sparkles
      }
    ];

    // Filter based on personality and love language
    return baseIdeas.filter(idea => {
      if (userProfile.personalityType.includes("Introspective") && idea.mood.includes("Intimate")) return true;
      if (userProfile.personalityType.includes("Adventurous") && idea.mood.includes("Outdoor")) return true;
      if (idea.loveLanguageMatch.includes(userProfile.loveLanguage)) return true;
      return false;
    }).slice(0, 3);
  };

  const personalizedDates = getPersonalizedDates();

  const localExperiences = [
    { name: "Jazz Night at The Blue Note", type: "Music", distance: "0.8 miles" },
    { name: "Weekend Farmer's Market", type: "Food & Culture", distance: "1.2 miles" },
    { name: "Wine Tasting Class", type: "Learning", distance: "2.1 miles" }
  ];

  const planningBoard = [
    { task: "Choose restaurant", assigned: "Me", completed: false },
    { task: "Make reservation", assigned: "Partner", completed: true },
    { task: "Plan conversation topics", assigned: "Me", completed: false }
  ];

  const sections = [
    { id: 'suggestions', label: 'Dating Planner', icon: Sparkles },
    { id: 'local', label: 'Local Events', icon: MapPin },
    { id: 'planning', label: 'Planning Board', icon: Users }
  ];

  return (
    <div className="pb-20 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
          Date Concierge 🌟
        </h1>
        <p className="text-muted-foreground">Never lose the spark</p>
      </div>

      {/* Section Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              variant={activeSection === section.id ? "romance" : "soft"}
              size="sm"
              className="whitespace-nowrap"
            >
              <IconComponent className="w-4 h-4 mr-1" />
              {section.label}
            </Button>
          );
        })}
      </div>

      {/* AI Date Suggestions */}
      {activeSection === 'suggestions' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">Dating Planner</h2>
            <FTUETooltip
              id="dating-planner"
              title="Dating Planner"
              description="Get personalized date ideas perfectly tailored to your love language, personality, and relationship goals."
            />
          </div>
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>Perfect for {userProfile.loveLanguage} lovers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                These dates are personalized based on your love language and personality
              </p>
            </CardContent>
          </Card>

          {personalizedDates.map((date, index) => {
            const IconComponent = date.icon;
            return (
              <Card key={index} className="shadow-soft border-primary/10 hover:shadow-romance transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <IconComponent className="w-5 h-5 text-primary" />
                    <span className="text-lg">{date.name}</span>
                    <Badge variant="secondary">{date.budget}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground">{date.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {date.mood.map((mood) => (
                      <Badge key={mood} variant="outline" className="text-xs">
                        {mood}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="romance" size="sm" className="flex-1">
                      Plan This Date 💕
                    </Button>
                    <Button variant="soft" size="sm">
                      Save for Later
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Local Experiences */}
      {activeSection === 'local' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">Local Events</h2>
            <FTUETooltip
              id="local-events"
              title="Local Events"
              description="Discover exciting activities and hidden gems in your area to create unforgettable experiences together."
            />
          </div>
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>Local Experiences</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Discover exciting activities near you
              </p>
            </CardContent>
          </Card>

          {localExperiences.map((experience, index) => (
            <Card key={index} className="shadow-soft border-primary/10">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-medium text-foreground">{experience.name}</h3>
                    <p className="text-sm text-muted-foreground">{experience.type}</p>
                    <p className="text-xs text-accent flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {experience.distance}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="text-center p-4">
            <p className="text-xs text-muted-foreground">
              Local experience matching requires location services & API integration
            </p>
          </div>
        </div>
      )}

      {/* Shared Planning Board */}
      {activeSection === 'planning' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">Planning Board</h2>
            <FTUETooltip
              id="planning-board"
              title="Planning Board"
              description="Collaborate with your partner to plan the perfect date night and keep track of who's doing what."
            />
          </div>
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>Shared Planning Board</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Collaborate with your partner to plan the perfect date
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg">Next Date Night</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {planningBoard.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-soft rounded-lg">
                  <input 
                    type="checkbox" 
                    checked={item.completed}
                    className="rounded border-primary"
                    readOnly
                  />
                  <div className="flex-1">
                    <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.task}
                    </p>
                    <p className="text-xs text-muted-foreground">Assigned to: {item.assigned}</p>
                  </div>
                </div>
              ))}
              <Button variant="romance" className="w-full mt-4">
                Add New Task ✨
              </Button>
            </CardContent>
          </Card>

          <div className="text-center p-4">
            <p className="text-xs text-muted-foreground">
              Real-time collaboration requires backend integration
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateConciergeModule;