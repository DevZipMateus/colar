import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type ActivityType = 
  | 'transaction_added' 
  | 'transaction_updated' 
  | 'transaction_deleted'
  | 'task_created' 
  | 'task_completed' 
  | 'task_deleted'
  | 'inventory_updated' 
  | 'member_joined';

interface Activity {
  id: string;
  group_id: string;
  user_id: string;
  activity_type: ActivityType;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  user_name?: string;
}

export const useActivityFeed = (groupId: string | null) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchActivities = async () => {
    if (!groupId || !user) return;
    
    try {
      setLoading(true);
      
      // Fetch activities with user profiles
      const { data, error } = await supabase
        .from('activity_feed')
        .select(`
          id,
          group_id,
          user_id,
          activity_type,
          description,
          metadata,
          created_at
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set(data.map(activity => activity.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const activitiesWithUserNames = data.map(activity => ({
        ...activity,
        activity_type: activity.activity_type as ActivityType,
        metadata: activity.metadata as Record<string, any>,
        user_name: profiles?.find(p => p.id === activity.user_id)?.name || 'Usuário'
      }));

      setActivities(activitiesWithUserNames);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const addActivity = async (
    activityType: ActivityType,
    description: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!groupId || !user) return;

    try {
      const { error } = await supabase
        .from('activity_feed')
        .insert({
          group_id: groupId,
          user_id: user.id,
          activity_type: activityType,
          description,
          metadata
        });

      if (error) throw error;

      // Refresh activities after adding new one
      await fetchActivities();
    } catch (error) {
      console.error('Erro ao adicionar atividade:', error);
    }
  };

  const formatActivityTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), {
      addSuffix: true,
      locale: ptBR
    });
  };

  const getActivityIcon = (activityType: ActivityType) => {
    switch (activityType) {
      case 'transaction_added':
      case 'transaction_updated':
      case 'transaction_deleted':
        return 'DollarSign';
      case 'task_created':
      case 'task_completed':
      case 'task_deleted':
        return 'CheckSquare';
      case 'inventory_updated':
        return 'Package';
      case 'member_joined':
        return 'Users';
      default:
        return 'Activity';
    }
  };

  const getActivityColor = (activityType: ActivityType) => {
    switch (activityType) {
      case 'transaction_added':
      case 'transaction_updated':
      case 'transaction_deleted':
        return 'colar-orange';
      case 'task_created':
      case 'task_completed':
      case 'task_deleted':
        return 'colar-navy';
      case 'inventory_updated':
        return 'colar-red';
      case 'member_joined':
        return 'colar-green';
      default:
        return 'gray';
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [groupId, user]);

  return {
    activities,
    loading,
    addActivity,
    formatActivityTime,
    getActivityIcon,
    getActivityColor,
    refreshActivities: fetchActivities
  };
};