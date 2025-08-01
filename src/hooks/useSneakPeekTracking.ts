import { useState, useEffect, useCallback } from 'react';

interface SneakPeekState {
  isFreeTrial: boolean;
  isSneakPeek: boolean;
  questionsViewed: number;
  hasHitLimit: boolean;
}

export const useSneakPeekTracking = () => {
  const [state, setState] = useState<SneakPeekState>({
    isFreeTrial: false,
    isSneakPeek: false,
    questionsViewed: 0,
    hasHitLimit: false
  });

  // Initialize state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sneakPeekState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setState(parsedState);
      } catch (error) {
        console.error('Error parsing sneak peek state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sneakPeekState', JSON.stringify(state));
  }, [state]);

  // Set user as free trial user (full premium access)
  const setAsFreeTrial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isFreeTrial: true,
      isSneakPeek: false,
      hasHitLimit: false
    }));
  }, []);

  // Set user as sneak peek user (limited access)
  const setAsSneakPeek = useCallback(() => {
    setState(prev => ({
      ...prev,
      isFreeTrial: false,
      isSneakPeek: true,
      questionsViewed: 0,
      hasHitLimit: false
    }));
  }, []);

  // Track a viewed question for sneak peek users
  const trackQuestionViewed = useCallback(() => {
    if (!state.isSneakPeek || state.hasHitLimit) return false;
    
    setState(prev => {
      const newQuestionsViewed = prev.questionsViewed + 1;
      const hasHitLimit = newQuestionsViewed >= 10;
      
      return {
        ...prev,
        questionsViewed: newQuestionsViewed,
        hasHitLimit
      };
    });

    // Return true if this view triggered the limit
    return state.questionsViewed + 1 >= 10;
  }, [state.isSneakPeek, state.hasHitLimit, state.questionsViewed]);

  // Check if user should see paywall for "Next" action
  const shouldShowPaywallForNext = useCallback(() => {
    return state.isSneakPeek && (state.hasHitLimit || state.questionsViewed >= 10);
  }, [state.isSneakPeek, state.hasHitLimit, state.questionsViewed]);

  // Check if user should see paywall for "Ask Purposely" action
  const shouldShowPaywallForAskPurposely = useCallback(() => {
    return state.isSneakPeek;
  }, [state.isSneakPeek]);

  // Reset tracking (useful for testing or when user upgrades)
  const resetTracking = useCallback(() => {
    setState({
      isFreeTrial: false,
      isSneakPeek: false,
      questionsViewed: 0,
      hasHitLimit: false
    });
    localStorage.removeItem('sneakPeekState');
  }, []);

  // Get remaining questions for sneak peek users
  const getRemainingQuestions = useCallback(() => {
    if (!state.isSneakPeek) return null;
    return Math.max(0, 10 - state.questionsViewed);
  }, [state.isSneakPeek, state.questionsViewed]);

  return {
    ...state,
    setAsFreeTrial,
    setAsSneakPeek,
    trackQuestionViewed,
    shouldShowPaywallForNext,
    shouldShowPaywallForAskPurposely,
    resetTracking,
    getRemainingQuestions
  };
};