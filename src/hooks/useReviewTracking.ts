import { useState, useEffect } from 'react';

interface ReviewTrackingState {
  shouldShowReview: boolean;
  showReviewModal: () => void;
  hideReviewModal: () => void;
  markReviewAsShown: () => void;
}

const TRACKING_KEYS = {
  FIRST_VISIT: 'purposely_first_visit_time',
  LOGIN_COUNT: 'purposely_login_count',
  REVIEW_SHOWN: 'purposely_review_modal_shown',
  REVIEW_SUBMITTED: 'purposely_review_submitted',
  SESSION_START: 'purposely_session_start',
  TOTAL_TIME_SPENT: 'purposely_total_time_spent'
};

const THIRTY_MINUTES_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useReviewTracking = (): ReviewTrackingState => {
  const [shouldShowReview, setShouldShowReview] = useState(false);

  // Initialize tracking data on first visit
  const initializeTracking = () => {
    const now = Date.now();
    
    // Set first visit time if not exists
    if (!localStorage.getItem(TRACKING_KEYS.FIRST_VISIT)) {
      localStorage.setItem(TRACKING_KEYS.FIRST_VISIT, now.toString());
    }
    
    // Set session start time
    localStorage.setItem(TRACKING_KEYS.SESSION_START, now.toString());
    
    // Increment login count
    const currentCount = parseInt(localStorage.getItem(TRACKING_KEYS.LOGIN_COUNT) || '0');
    localStorage.setItem(TRACKING_KEYS.LOGIN_COUNT, (currentCount + 1).toString());
  };

  // Track time spent in the app
  const trackTimeSpent = () => {
    const sessionStart = parseInt(localStorage.getItem(TRACKING_KEYS.SESSION_START) || Date.now().toString());
    const currentTime = Date.now();
    const sessionDuration = currentTime - sessionStart;
    
    const totalTimeSpent = parseInt(localStorage.getItem(TRACKING_KEYS.TOTAL_TIME_SPENT) || '0');
    localStorage.setItem(TRACKING_KEYS.TOTAL_TIME_SPENT, (totalTimeSpent + sessionDuration).toString());
    
    // Update session start for next calculation
    localStorage.setItem(TRACKING_KEYS.SESSION_START, currentTime.toString());
  };

  // Check if conditions are met to show review modal
  const checkReviewConditions = () => {
    const reviewAlreadyShown = localStorage.getItem(TRACKING_KEYS.REVIEW_SHOWN) === 'true';
    const reviewSubmitted = localStorage.getItem(TRACKING_KEYS.REVIEW_SUBMITTED) === 'true';
    
    // Don't show if already shown or submitted
    if (reviewAlreadyShown || reviewSubmitted) {
      return false;
    }
    
    const loginCount = parseInt(localStorage.getItem(TRACKING_KEYS.LOGIN_COUNT) || '0');
    const totalTimeSpent = parseInt(localStorage.getItem(TRACKING_KEYS.TOTAL_TIME_SPENT) || '0');
    
    // Show on second login OR after 30 minutes of usage
    return loginCount >= 2 || totalTimeSpent >= THIRTY_MINUTES_MS;
  };

  // Initialize tracking and check conditions
  useEffect(() => {
    initializeTracking();
    
    // Check conditions immediately
    if (checkReviewConditions()) {
      // Delay showing the modal by 2 seconds to let the app load
      setTimeout(() => {
        setShouldShowReview(true);
      }, 2000);
    }
    
    // Set up interval to track time and check conditions
    const interval = setInterval(() => {
      trackTimeSpent();
      
      if (!shouldShowReview && checkReviewConditions()) {
        setShouldShowReview(true);
      }
    }, 30000); // Check every 30 seconds
    
    // Track time on page unload
    const handleBeforeUnload = () => {
      trackTimeSpent();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      trackTimeSpent(); // Final time tracking
    };
  }, [shouldShowReview]);

  const showReviewModal = () => {
    setShouldShowReview(true);
  };

  const hideReviewModal = () => {
    setShouldShowReview(false);
  };

  const markReviewAsShown = () => {
    localStorage.setItem(TRACKING_KEYS.REVIEW_SHOWN, 'true');
    setShouldShowReview(false);
  };

  return {
    shouldShowReview,
    showReviewModal,
    hideReviewModal,
    markReviewAsShown
  };
};

// Utility function to reset tracking (for testing)
export const resetReviewTracking = () => {
  Object.values(TRACKING_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Utility function to get tracking stats (for debugging)
export const getTrackingStats = () => {
  return {
    firstVisit: localStorage.getItem(TRACKING_KEYS.FIRST_VISIT),
    loginCount: localStorage.getItem(TRACKING_KEYS.LOGIN_COUNT),
    reviewShown: localStorage.getItem(TRACKING_KEYS.REVIEW_SHOWN),
    reviewSubmitted: localStorage.getItem(TRACKING_KEYS.REVIEW_SUBMITTED),
    totalTimeSpent: localStorage.getItem(TRACKING_KEYS.TOTAL_TIME_SPENT)
  };
};