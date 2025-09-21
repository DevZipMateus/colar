import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GroupMemberDisplay {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  display_name: string;
  email?: string | null;
}

export const useGroupMembersDisplay = (groupId: string | null) => {
  const [members, setMembers] = useState<GroupMemberDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembersDisplay = async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    try {
      // Use a safe query that respects privacy settings
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles!inner(display_name, show_email_in_groups, email)
        `)
        .eq('group_id', groupId);

      if (error) {
        console.error('Error fetching group members display:', error);
        return;
      }

      // Transform the data to show display names and respect email privacy
      const transformedMembers = data?.map(member => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        display_name: member.profiles?.display_name || 'Member',
        email: member.profiles?.show_email_in_groups ? member.profiles.email : null
      })) || [];

      setMembers(transformedMembers);
    } catch (error) {
      console.error('Error in fetchMembersDisplay:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembersDisplay();
  }, [groupId]);

  return {
    members,
    loading,
    refetch: fetchMembersDisplay,
  };
};