import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useIsAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchRole = async () => {
      if (!user) {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        if (!cancelled) {
          if (error) {
            console.warn('Failed to fetch user_roles:', error);
            setIsAdmin(false);
          } else {
            setIsAdmin((data || []).some(r => r.role === 'admin'));
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('useIsAdmin error:', e);
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRole();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { isAdmin, loading };
};
