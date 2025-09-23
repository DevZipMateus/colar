
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchGroups = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch groups where the user is a member
      const { data: memberGroups, error: memberError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          groups!inner (
            id,
            name,
            description,
            invite_code,
            created_by,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error fetching groups:', memberError);
        return;
      }

      // Extract the groups from the nested structure
      const groupsData = memberGroups?.map(item => item.groups) || [];
      setGroups(groupsData);
      
      // Set first group as current if none selected
      if (!currentGroup && groupsData && groupsData.length > 0) {
        setCurrentGroup(groupsData[0]);
      }
    } catch (error) {
      console.error('💥 Error in fetchGroups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (name: string, description?: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) {
        console.error('Error creating group:', groupError);
        return { error: groupError.message };
      }

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) {
        console.error('Error adding member:', memberError);
        return { error: memberError.message };
      }

      await fetchGroups();
      return { data: groupData, error: null };
    } catch (error) {
      console.error('💥 Error in createGroup:', error);
      return { error: 'Failed to create group' };
    }
  };

  const joinGroup = async (inviteCode: string) => {
    if (!user) {
      return { error: 'User not authenticated' };
    }

    // Check email confirmation - be more flexible for password reset users
    if (!user.email_confirmed_at) {
      console.log('⚠️ Email confirmation status unclear, proceeding with caution');
    }

    try {
      // Clean and validate invite code
      const cleanInviteCode = inviteCode.trim();
      
      // Validate invite code format (12 hex characters)
      if (!cleanInviteCode || cleanInviteCode.length !== 12 || !/^[a-fA-F0-9]{12}$/.test(cleanInviteCode)) {
        return { error: 'Formato de código inválido. Use 12 caracteres.' };
      }

      console.log('🔍 Searching for group with code:', cleanInviteCode);
      
      // Find group by invite code using case-insensitive search
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .ilike('invite_code', cleanInviteCode)
        .maybeSingle();

      if (groupError) {
        console.error('Error searching for group:', groupError);
        return { error: 'Erro ao buscar grupo. Tente novamente.' };
      }

      if (!groupData) {
        return { error: 'Código de convite inválido ou expirado' };
      }

      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupData.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberCheckError) {
        console.error('Error checking membership:', memberCheckError);
        return { error: 'Erro ao verificar participação. Tente novamente.' };
      }

      if (existingMember) {
        return { error: 'Você já faz parte deste grupo' };
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'member',
        });

      if (memberError) {
        console.error('Error joining group:', memberError);
        return { error: 'Erro ao entrar no grupo. Tente novamente.' };
      }
      
      await fetchGroups();
      return { data: groupData, error: null };

    } catch (error) {
      console.error('💥 Unexpected error in joinGroup:', error);
      return { error: 'Erro inesperado. Tente novamente.' };
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroups();
    } else {
      setGroups([]);
      setCurrentGroup(null);
      setLoading(false);
    }
  }, [user]);

  return {
    groups,
    currentGroup,
    setCurrentGroup,
    loading,
    createGroup,
    joinGroup,
    fetchGroups,
  };
};
