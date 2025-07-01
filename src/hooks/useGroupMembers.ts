
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export const useGroupMembers = (groupId: string | null) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMembers = async () => {
    if (!user || !groupId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles (
            name,
            email,
            avatar_url
          )
        `)
        .eq('group_id', groupId);

      if (error) {
        console.error('Error fetching group members:', error);
        return;
      }

      console.log('Fetched members data:', data);
      setMembers(data || []);
    } catch (error) {
      console.error('Error in fetchMembers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [user, groupId]);

  return {
    members,
    loading,
    fetchMembers,
  };
};
