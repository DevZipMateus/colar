
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
      console.log('🔍 Fetching groups for user:', user.id);
      
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
        console.error('❌ Error fetching groups:', memberError);
        return;
      }

      console.log('📊 Raw member groups data:', memberGroups);

      // Extract the groups from the nested structure
      const groupsData = memberGroups?.map(item => item.groups) || [];
      
      console.log('📋 Processed groups data:', groupsData);
      console.log('🔢 Total groups found:', groupsData.length);
      
      setGroups(groupsData);
      
      // Set first group as current if none selected
      if (!currentGroup && groupsData && groupsData.length > 0) {
        console.log('🎯 Setting first group as current:', groupsData[0]);
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
      console.log('🆕 Creating group:', { name, description, userId: user.id });
      
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
        console.error('❌ Error creating group:', groupError);
        return { error: groupError.message };
      }

      console.log('✅ Group created successfully:', groupData);

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) {
        console.error('❌ Error adding member:', memberError);
        return { error: memberError.message };
      }

      console.log('✅ Creator added as admin member');
      await fetchGroups();
      return { data: groupData, error: null };
    } catch (error) {
      console.error('💥 Error in createGroup:', error);
      return { error: 'Failed to create group' };
    }
  };

  const joinGroup = async (inviteCode: string) => {
    if (!user) {
      console.log('❌ No user authenticated');
      return { error: 'User not authenticated' };
    }

    console.log('🚀 Starting joinGroup process with user:', {
      id: user.id,
      email: user.email,
      emailConfirmed: !!user.email_confirmed_at,
      confirmDate: user.email_confirmed_at
    });

    // Check email confirmation with more detailed logging
    if (!user.email_confirmed_at) {
      console.log('❌ Email not confirmed:', {
        email: user.email,
        confirmField: user.email_confirmed_at,
        userObject: user
      });
      return { error: 'Confirme seu email antes de entrar no grupo' };
    }

    try {
      const cleanInviteCode = inviteCode.trim().toLowerCase();
      console.log('🔍 Attempting to join group with cleaned invite code:', cleanInviteCode);

      // Step 1: Find group by invite code with multiple approaches
      console.log('🔎 Step 1: Searching for group...');
      
      // Try direct query first (most reliable)
      let { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', cleanInviteCode)
        .maybeSingle();

      if (groupError) {
        console.error('❌ Error in direct search:', groupError);
        return { error: 'Erro ao buscar grupo. Tente novamente.' };
      }

      // If not found with exact match, try case-insensitive search using ilike
      if (!groupData) {
        console.log('🔄 Direct search failed, trying case-insensitive search...');
        const { data: foundGroup, error: searchError } = await supabase
          .from('groups')
          .select('*')
          .ilike('invite_code', cleanInviteCode)
          .maybeSingle();

        if (searchError) {
          console.error('❌ Error in case-insensitive search:', searchError);
          return { error: 'Erro ao buscar grupo. Tente novamente.' };
        }

        groupData = foundGroup;
        console.log('🎯 Found group with case-insensitive search:', groupData?.id);
      }

      if (!groupData) {
        console.log('❌ No group found with invite code:', cleanInviteCode);
        return { error: 'Código de convite inválido ou expirado' };
      }

      console.log('✅ Found group:', {
        id: groupData.id,
        name: groupData.name,
        code: groupData.invite_code
      });

      // Step 2: Check if user is already a member
      console.log('🔍 Step 2: Checking existing membership...');
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupData.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberCheckError) {
        console.error('❌ Error checking membership:', memberCheckError);
        return { error: 'Erro ao verificar participação. Tente novamente.' };
      }

      if (existingMember) {
        console.log('ℹ️ User is already a member:', existingMember);
        return { error: 'Você já faz parte deste grupo' };
      }

      // Step 3: Add user as member
      console.log('➕ Step 3: Adding user to group...');
      const { data: newMember, error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'member',
        })
        .select()
        .single();

      if (memberError) {
        console.error('❌ Error joining group:', memberError);
        return { error: 'Erro ao entrar no grupo. Tente novamente.' };
      }

      console.log('✅ Successfully joined group:', newMember);
      
      // Step 4: Refresh groups
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
