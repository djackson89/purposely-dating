import { useState, useCallback } from 'react';

interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  timestamp: number;
  userId?: string;
}

interface UserProperties {
  age?: string;
  gender?: string;
  loveLanguage?: string;
  relationshipStatus?: string;
  personalityType?: string;
}

export const useAnalytics = () => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  // Track events
  const trackEvent = useCallback((eventName: string, parameters?: Record<string, any>) => {
    const event: AnalyticsEvent = {
      name: eventName,
      parameters,
      timestamp: Date.now(),
    };

    setEvents(prev => [...prev, event]);
    
    // Log to console for development
    console.log('Analytics Event:', event);
    
    // In production, you would send this to your analytics service
    // Example: send to Google Analytics, Mixpanel, or custom endpoint
  }, []);

  // Set user properties
  const setUserProperties = useCallback((properties: UserProperties) => {
    console.log('User Properties Set:', properties);
    
    // In production, you would send this to your analytics service
    localStorage.setItem('user_analytics_properties', JSON.stringify(properties));
  }, []);

  // Track screen views
  const trackScreenView = useCallback((screenName: string, screenClass?: string) => {
    trackEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  }, [trackEvent]);

  // Track user engagement
  const trackUserEngagement = useCallback((action: string, category: string, value?: number) => {
    trackEvent('user_engagement', {
      action,
      category,
      value,
    });
  }, [trackEvent]);

  // Track errors (basic crash reporting)
  const trackError = useCallback((error: Error, context?: string) => {
    const errorEvent = {
      name: 'app_error',
      parameters: {
        error_message: error.message,
        error_stack: error.stack,
        context,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    setEvents(prev => [...prev, errorEvent]);
    console.error('Error tracked:', errorEvent);
    
    // In production, send to crash reporting service
  }, []);

  // Get analytics summary
  const getAnalyticsSummary = useCallback(() => {
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const recentEvents = events.filter(event => event.timestamp > last24Hours);
    
    return {
      totalEvents: events.length,
      recentEvents: recentEvents.length,
      eventTypes: [...new Set(events.map(e => e.name))],
      lastEvent: events[events.length - 1] || null,
    };
  }, [events]);

  return {
    trackEvent,
    setUserProperties,
    trackScreenView,
    trackUserEngagement,
    trackError,
    getAnalyticsSummary,
    events,
  };
};