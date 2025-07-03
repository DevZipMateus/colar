
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  processPendingInvite: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Process pending invite when user signs in/up
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            processPendingInvite();
          }, 100);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const processPendingInvite = async () => {
    const pendingInvite = localStorage.getItem('pending_invite');
    if (pendingInvite && user) {
      console.log('Processing pending invite:', pendingInvite);
      
      try {
        // Import dynamically to avoid circular dependency
        const { useGroups } = await import('../hooks/useGroups');
        const groups = useGroups();
        
        const result = await groups.joinGroup(pendingInvite);
        
        if (result.error) {
          console.error('Error processing pending invite:', result.error);
          toast({
            title: "Erro ao processar convite",
            description: result.error,
            variant: "destructive",
          });
        } else {
          console.log('Successfully processed pending invite');
          toast({
            title: "Bem-vindo ao grupo!",
            description: `Você foi adicionado ao grupo "${result.data?.name}" com sucesso.`,
          });
        }
      } catch (error) {
        console.error('Error in processPendingInvite:', error);
      } finally {
        // Clear the pending invite
        localStorage.removeItem('pending_invite');
      }
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    // Store invite code if present in URL before signup
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite');
    
    if (inviteCode) {
      console.log('Storing invite code for after signup:', inviteCode);
      localStorage.setItem('pending_invite', inviteCode);
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Store invite code if present in URL before signin
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite');
    
    if (inviteCode) {
      console.log('Storing invite code for after signin:', inviteCode);
      localStorage.setItem('pending_invite', inviteCode);
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // Clear any pending invites on logout
    localStorage.removeItem('pending_invite');
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    processPendingInvite,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
