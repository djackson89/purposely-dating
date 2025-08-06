import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useReviewTracking } from "@/hooks/useReviewTracking";
import ReviewRequestModal from "@/components/ReviewRequestModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();
  const { shouldShowReview, hideReviewModal, markReviewAsShown } = useReviewTracking();

  // Enhanced loading state with error handling for iPad
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft safe-area-pt safe-area-pb">
        <div className="text-center px-4 max-w-sm mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Purposely...</h2>
          <p className="text-muted-foreground text-sm">Setting up your dating assistant</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => window.location.reload()} />;
  }

  const handleCloseReviewModal = () => {
    markReviewAsShown();
    hideReviewModal();
  };

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth onAuthSuccess={() => window.location.href = '/'} />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      
      {/* Review Request Modal */}
      <ReviewRequestModal 
        isOpen={shouldShowReview} 
        onClose={handleCloseReviewModal}
      />
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
