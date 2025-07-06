import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export const useGroupMembers = (groupId: string) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Fetching members for group:', groupId);
      
      // First get group members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('id, user_id, group_id, role, joined_at')
        .eq('group_id', groupId);

      if (membersError) {
        console.error('❌ Error fetching group members:', membersError);
        return;
      }

      if (!membersData || membersData.length === 0) {
        console.log('✅ No group members found');
        setMembers([]);
        return;
      }

      // Get all user IDs to fetch profiles
      const userIds = membersData.map(member => member.user_id);
      
      // Fetch profiles for all members
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        return;
      }

      // Combine the data
      const membersWithProfiles = membersData.map(member => ({
        ...member,
        profiles: profilesData?.find(profile => profile.id === member.user_id) || null
      }));

      console.log('✅ Group members with profiles fetched:', membersWithProfiles);
      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('💥 Error in fetchMembers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  const removeMember = async (memberId: string) => {
    try {
      console.log('🗑️ Removing member:', memberId);
      
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('❌ Error removing member:', error);
        throw error;
      }

      console.log('✅ Member removed successfully');
      await fetchMembers(); // Refresh the members list
      return { success: true };
    } catch (error) {
      console.error('💥 Error in removeMember:', error);
      return { error: 'Não foi possível remover o membro. Tente novamente.' };
    }
  };

  return {
    members,
    loading,
    fetchMembers,
    removeMember,
  };
};