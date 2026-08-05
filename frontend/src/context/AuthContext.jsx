import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useInvestigation } from './InvestigationContext';

const AuthContext = createContext({});

export const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || (import.meta.env.VITE_SUPABASE_URL ? 'supabase' : 'demo');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setInvestigationId } = useInvestigation();

  useEffect(() => {
    if (AUTH_MODE === 'demo') {
      // Demo Mode: Check for isolated session stored in sessionStorage
      try {
        const storedDemoUser = sessionStorage.getItem('sentinel_demo_user');
        if (storedDemoUser) {
          const parsedUser = JSON.parse(storedDemoUser);
          setUser(parsedUser);
          setSession({ user: parsedUser, access_token: `demo-token-${parsedUser.id}` });
        }
      } catch (e) {
        console.error("Failed to load demo user session:", e);
      }
      setLoading(false);
    } else {
      // Supabase Production Mode
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (_event === 'SIGNED_OUT') {
          localStorage.removeItem('inv_id');
          if (setInvestigationId) {
            setInvestigationId(null);
          }
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [setInvestigationId]);

  const signIn = async (email, password) => {
    if (AUTH_MODE === 'demo') {
      // Generate unique isolated temporary demo identity per session
      const randomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).substring(2, 10);
      const demoUserId = `demo-user-${randomSuffix}`;
      const demoUser = {
        id: demoUserId,
        email: email || `analyst-${randomSuffix}@sentinel.demo`,
        role: 'soc_analyst',
        is_demo: true,
        created_at: new Date().toISOString()
      };
      sessionStorage.setItem('sentinel_demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      setSession({ user: demoUser, access_token: `demo-token-${demoUserId}` });
      return { error: null, data: { user: demoUser } };
    }

    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email, password) => {
    if (AUTH_MODE === 'demo') {
      return signIn(email, password);
    }
    return supabase.auth.signUp({ email, password });
  };

  const signOut = async () => {
    if (AUTH_MODE === 'demo') {
      sessionStorage.removeItem('sentinel_demo_user');
      localStorage.removeItem('inv_id');
      if (setInvestigationId) {
        setInvestigationId(null);
      }
      setUser(null);
      setSession(null);
      return { error: null };
    }

    return supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, signIn, signUp, signOut, loading, authMode: AUTH_MODE }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
