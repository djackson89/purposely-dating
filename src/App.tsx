import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Calendar, Sparkles } from "lucide-react";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

// Simple app with working logout
const MainApp = () => {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    localStorage.clear();
  };

  return (
    <div className="min-h-screen bg-background p-4 animate-fade-in-up">
      
      {/* Header with logout */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-2">
          <Heart className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">Purposely</h1>
        </div>
        <Button onClick={handleLogout} variant="outline" size="sm">
          Logout
        </Button>
      </div>

      {/* Welcome message */}
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div>
          <h2 className="text-3xl font-bold mb-4">Welcome to Purposely! 💕</h2>
          <p className="text-lg text-muted-foreground">
            Your dating strategist, self-love coach, and wingwoman all in one.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <MessageCircle className="w-8 h-8 text-primary mx-auto" />
              <CardTitle className="text-center">Conversation Starters</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Access 10,000+ expert-crafted questions for meaningful conversations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="w-8 h-8 text-primary mx-auto" />
              <CardTitle className="text-center">AI Practice Partner</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Practice conversations and get the perfect text replies.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="w-8 h-8 text-primary mx-auto" />
              <CardTitle className="text-center">Date Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Curated date ideas that align with your values and love language.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            App is working! The full features will be restored once we complete the setup.
          </p>
          <Button size="lg" className="bg-primary text-white">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  console.log('AppContent render - user:', !!user, 'loading:', loading);

  // Prevent flickering by using a more stable loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center transition-all duration-300">
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading Purposely...</p>
        </div>
      </div>
    );
  }

  // Smooth transition between auth and main app
  return (
    <div className="min-h-screen transition-all duration-300 ease-in-out">
      {!user ? <Auth /> : <MainApp />}
    </div>
  );
};

const App = () => {
  console.log('App rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;