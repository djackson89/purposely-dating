import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Calendar, Sparkles, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Custom Auth Hook - Built from scratch
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 Auth hook initializing...');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('🔐 Initial session:', !!session);
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Session fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    getInitialSession();

    return () => {
      console.log('🔐 Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('🔐 Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      return { error };
    }
    return { error: null };
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user
  };
};

// Auth Component - Built from scratch
const AuthComponent = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields."
      });
      return false;
    }

    if (!isLogin) {
      if (!formData.fullName) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please enter your full name."
        });
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          variant: "destructive",
          title: "Password Mismatch",
          description: "Passwords do not match."
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    console.log('🔐 Attempting auth:', isLogin ? 'login' : 'signup');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          console.error('Login error:', error);
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.message
          });
        } else {
          console.log('🔐 Login successful:', !!data.user);
          toast({
            title: "Welcome back!",
            description: "You have been logged in successfully."
          });
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: formData.fullName,
            }
          }
        });

        if (error) {
          console.error('Signup error:', error);
          toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: error.message
          });
        } else {
          console.log('🔐 Signup successful:', !!data.user);
          toast({
            title: "Account Created!",
            description: data.user?.email_confirmed_at 
              ? "You can now log in to your account."
              : "Please check your email to confirm your account."
          });
          
          if (data.user?.email_confirmed_at) {
            setIsLogin(true);
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    console.log('🔐 Attempting Google auth...');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('Google auth error:', error);
        toast({
          variant: "destructive",
          title: "Google Sign In Failed",
          description: error.message
        });
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign in with Google. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      fullName: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Purposely</h1>
          </div>
          <h2 className="text-3xl font-bold">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {isLogin 
              ? 'Sign in to your account to continue' 
              : 'Join thousands finding meaningful connections'
            }
          </p>
        </div>

        {/* Auth Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    required={!isLogin}
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                    <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full"
              >
                Continue with Google
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={switchMode}
                className="text-sm text-primary hover:underline"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </CardContent>
        </Card>

        {/* App Features */}
        <div className="text-center space-y-4 text-sm text-muted-foreground">
          <p>✨ Expert-crafted conversation starters</p>
          <p>🤖 AI-powered practice conversations</p>
          <p>💕 Personalized date planning</p>
        </div>
      </div>
    </div>
  );
};

// Main App Component that handles user state and navigation
const MainApp = () => {
  const { signOut, user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [loading, setLoading] = useState(true);

  console.log('🏠 MainApp rendering, user:', !!user, 'view:', currentView);

  useEffect(() => {
    if (user) {
      // Create a minimal user profile for now
      const profile = {
        firstName: user.user_metadata?.full_name || 'User',
        full_name: user.user_metadata?.full_name || 'User',
        first_name: user.user_metadata?.full_name || 'User',
        loveLanguage: 'Words of Affirmation',
        relationshipStatus: 'Single & Looking',
        age: '25-34',
        gender: 'Female',
        personalityType: 'Balanced Mix of Both'
      };
      setUserProfile(profile);
      setLoading(false);
    }
  }, [user]);

  const handleLogout = async () => {
    console.log('🔐 Logout requested');
    await signOut();
    localStorage.clear();
  };

  const handleNavigateToFlirtFuel = () => {
    console.log('🎯 Navigate to FlirtFuel');
    setCurrentView('flirtfuel');
  };

  const handleNavigateToAIPractice = (scenario?: string) => {
    console.log('🤖 Navigate to AI Practice:', scenario);
    setCurrentView('aipractice');
  };

  const handleNavigateToModule = (module: string) => {
    console.log('📱 Navigate to module:', module);
    setCurrentView(module);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Render different views based on currentView state
  if (currentView === 'home' && userProfile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Import and use the actual Home component */}
        <div className="pb-8 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen">
          {/* Header with logout */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                Logout
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
                Purposely 💕
              </h1>
              <div className="w-16" /> {/* Spacer */}
            </div>
          </div>

          {/* Welcome message */}
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-4">Welcome back, {userProfile.firstName}! 💕</h2>
              <p className="text-lg text-muted-foreground">
                Your dating strategist, self-love coach, and wingwoman all in one.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleNavigateToFlirtFuel}>
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

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigateToAIPractice()}>
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

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigateToModule('concierge')}>
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
                App is working! Click on the cards above to explore features.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show simple feature placeholders for other views
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center justify-between mb-8">
        <Button
          onClick={() => setCurrentView('home')}
          variant="ghost"
          className="text-primary"
        >
          ← Back to Home
        </Button>
        <Button onClick={handleLogout} variant="outline" size="sm">
          Logout
        </Button>
      </div>
      
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div>
          <h2 className="text-3xl font-bold mb-4">
            {currentView === 'flirtfuel' && 'Conversation Starters 💬'}
            {currentView === 'aipractice' && 'AI Practice Partner 🤖'}
            {currentView === 'concierge' && 'Date Planning 📅'}
            {currentView === 'therapy' && 'Therapy Companion 💝'}
          </h2>
          <p className="text-lg text-muted-foreground">
            This feature is coming soon! The full app will be restored once we complete the setup.
          </p>
        </div>
        
        <Button 
          onClick={() => setCurrentView('home')}
          size="lg" 
          className="bg-primary text-white"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4 animate-fade-in-up">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
      <p className="text-muted-foreground">Loading Purposely...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  console.log('🔐 ProtectedRoute - user:', !!user, 'loading:', loading);

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? <>{children}</> : <Navigate to="/auth" replace />;
};

// Auth Route Component
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  console.log('🔐 AuthRoute - user:', !!user, 'loading:', loading);

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? <Navigate to="/" replace /> : <>{children}</>;
};

// App Content with Routing
const AppContent = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/auth" 
          element={
            <AuthRoute>
              <AuthComponent />
            </AuthRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } 
        />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

// Main App Component
const App = () => {
  console.log('🚀 App rendering...');
  
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