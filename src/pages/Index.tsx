import React from 'react';

interface OnboardingData {
  firstName: string;
  profilePhoto?: string;
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender?: string;
  personalityType: string;
}

interface IndexProps {
  userProfile: OnboardingData | null;
}

const Index: React.FC<IndexProps> = ({ userProfile }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Main App</h1>
        <p className="text-muted-foreground">
          Welcome {userProfile?.firstName || 'User'}!
        </p>
      </div>
    </div>
  );
};

export default Index;