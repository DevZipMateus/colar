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
      
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          group_id,
          role,
          joined_at,
          profiles!group_members_user_id_profiles_fkey (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('group_id', groupId);

      if (error) {
        console.error('❌ Error fetching group members:', error);
        return;
      }

      console.log('✅ Group members fetched:', data);
      setMembers(data || []);
    } catch (error) {
      console.error('💥 Error in fetchMembers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  return {
    members,
    loading,
    fetchMembers,
  };
};