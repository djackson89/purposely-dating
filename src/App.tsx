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
import OnboardingFlow from "@/components/OnboardingFlow";
import Paywall from "@/components/Paywall";
import React from 'react';

// Error Boundary Component to catch rendering errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🚨 ERROR BOUNDARY: Caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ERROR BOUNDARY: Error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-destructive">Something went wrong</h2>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              variant="outline"
            >
              Reload App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const queryClient = new QueryClient();

// Custom Auth Hook - Built from scratch with extensive debugging
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔥 AUTH HOOK: Initializing...');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔥 AUTH HOOK: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔥 AUTH HOOK: Initial session result:', {
          hasSession: !!session,
          userId: session?.user?.id,
          error: error?.message
        });
        
        if (error) {
          console.error('🔥 AUTH HOOK: Error getting session:', error);
        } else {
          console.log('🔥 AUTH HOOK: Setting initial session state');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('🔥 AUTH HOOK: Session fetch error:', error);
      } finally {
        console.log('🔥 AUTH HOOK: Setting loading to false');
        setLoading(false);
      }
    };

    // Set up auth listener
    console.log('🔥 AUTH HOOK: Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔥 AUTH HOOK: Auth state change:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id
        });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    getInitialSession();

    return () => {
      console.log('🔥 AUTH HOOK: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('🔥 AUTH HOOK: Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('🔥 AUTH HOOK: Sign out error:', error);
      return { error };
    }
    console.log('🔥 AUTH HOOK: Sign out successful');
    return { error: null };
  };

  console.log('🔥 AUTH HOOK: Rendering with state:', {
    hasUser: !!user,
    loading,
    isAuthenticated: !!user
  });

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
  const [currentView, setCurrentView] = useState('loading'); // Start with loading
  const [onboardingStep, setOnboardingStep] = useState('welcome'); // welcome, paywall, quiz, completed
  const [loading, setLoading] = useState(true);

  console.log('🏠 MAIN APP: Rendering with state:', { 
    hasUser: !!user, 
    view: currentView, 
    onboardingStep,
    loading,
    userProfile: !!userProfile 
  });

  // Check user's onboarding status and subscription
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) return;

      try {
        console.log('🔍 CHECKING: User onboarding status...');
        
        // Check if user has completed onboarding
        const { data: settings, error: settingsError } = await supabase
          .from('user_settings')
          .select('onboarding_completed, intake_completed')
          .eq('user_id', user.id)
          .single();

        console.log('🔍 SETTINGS:', { settings, settingsError });

        // Check subscription status
        const { data: subscription, error: subError } = await supabase.functions.invoke('check-subscription');
        console.log('🔍 SUBSCRIPTION:', { subscription, subError });

        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('Error checking settings:', settingsError);
        }

        // Determine what step the user should see
        const hasCompletedOnboarding = settings?.onboarding_completed || false;
        const hasCompletedIntake = settings?.intake_completed || false;
        const isSubscribed = subscription?.data?.subscribed || false;

        if (!hasCompletedOnboarding) {
          console.log('🎯 FLOW: Starting welcome onboarding');
          setCurrentView('onboarding');
          setOnboardingStep('welcome');
        } else if (!isSubscribed) {
          console.log('🎯 FLOW: Showing paywall');
          setCurrentView('paywall');
        } else if (!hasCompletedIntake) {
          console.log('🎯 FLOW: Showing intake quiz');
          setCurrentView('onboarding');
          setOnboardingStep('quiz');
        } else {
          console.log('🎯 FLOW: User fully onboarded, showing home');
          // Create user profile from stored data or defaults
          const profile = {
            firstName: user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.first_name || 'User',
            full_name: user.user_metadata?.full_name || 'User',
            first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || 'User',
            loveLanguage: 'Words of Affirmation',
            relationshipStatus: 'Single & Looking',
            age: '25-34',
            gender: 'Female',
            personalityType: 'Balanced Mix of Both'
          };
          setUserProfile(profile);
          setCurrentView('home');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        // Default to welcome if error
        setCurrentView('onboarding');
        setOnboardingStep('welcome');
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [user]);

  const handleLogout = async () => {
    console.log('🔐 Logout requested');
    await signOut();
    localStorage.clear();
  };

  // Handle welcome onboarding completion
  const handleWelcomeComplete = async () => {
    console.log('✅ ONBOARDING: Welcome completed');
    
    try {
      // Mark welcome onboarding as completed
      await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      
      // Check subscription status to determine next step
      const { data: subscription } = await supabase.functions.invoke('check-subscription');
      
      if (!subscription?.data?.subscribed) {
        setCurrentView('paywall');
      } else {
        setCurrentView('onboarding');
        setOnboardingStep('quiz');
      }
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
  };

  // Handle paywall completion (subscription)
  const handlePaywallComplete = async () => {
    console.log('✅ PAYWALL: Subscription completed');
    setCurrentView('onboarding');
    setOnboardingStep('quiz');
  };

  // Handle paywall skip
  const handlePaywallSkip = async () => {
    console.log('⏭️ PAYWALL: Skipped');
    setCurrentView('onboarding');
    setOnboardingStep('quiz');
  };

  // Handle intake quiz completion
  const handleQuizComplete = async (data) => {
    console.log('✅ QUIZ: Intake completed', data);
    
    try {
      // Store the intake data and mark as completed
      await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            onboarding_completed: true,
            intake_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      // Set user profile and go to home
      setUserProfile({
        ...data,
        first_name: data.firstName,
        full_name: data.firstName
      });
      setCurrentView('home');
    } catch (error) {
      console.error('Error saving intake data:', error);
    }
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
          <p className="text-muted-foreground">Setting up your experience...</p>
        </div>
      </div>
    );
  }

  // Show welcome onboarding flow
  if (currentView === 'onboarding') {
    if (onboardingStep === 'welcome') {
      return (
        <OnboardingFlow 
          onComplete={handleWelcomeComplete}
          showOnlyWelcome={true}
        />
      );
    } else if (onboardingStep === 'quiz') {
      return (
        <OnboardingFlow 
          onComplete={handleQuizComplete}
          showOnlyQuiz={true}
        />
      );
    }
  }

  // Show paywall
  if (currentView === 'paywall') {
    return (
      <Paywall 
        onPlanSelected={handlePaywallComplete}
        onSkipToFree={handlePaywallSkip}
      />
    );
  }

  // Show main home screen
  if (currentView === 'home' && userProfile) {
    return (
      <div className="min-h-screen bg-background">
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
                Click on the cards above to explore features.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show feature placeholder screens
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

  console.log('🛡️ PROTECTED ROUTE: Rendering with state:', {
    hasUser: !!user,
    loading,
    userId: user?.id
  });

  if (loading) {
    console.log('🛡️ PROTECTED ROUTE: Showing loading screen');
    return <LoadingScreen />;
  }

  if (!user) {
    console.log('🛡️ PROTECTED ROUTE: No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('🛡️ PROTECTED ROUTE: User authenticated, rendering children');
  return <>{children}</>;
};

// Auth Route Component
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  console.log('🔓 AUTH ROUTE: Rendering with state:', {
    hasUser: !!user,
    loading,
    userId: user?.id
  });

  if (loading) {
    console.log('🔓 AUTH ROUTE: Showing loading screen');
    return <LoadingScreen />;
  }

  if (user) {
    console.log('🔓 AUTH ROUTE: User authenticated, redirecting to /');
    return <Navigate to="/" replace />;
  }

  console.log('🔓 AUTH ROUTE: No user, rendering auth component');
  return <>{children}</>;
};

// App Content with Routing
const AppContent = () => {
  console.log('🌍 APP CONTENT: Rendering...');
  
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
  console.log('🚀 APP: Starting app render...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <div className="app-wrapper">
            <AppContent />
            <Toaster />
            <Sonner />
          </div>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;