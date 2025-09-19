import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CardConfiguration {
  id: string;
  group_id: string;
  card_name: string;
  card_type: 'credit' | 'debit';
  due_day?: number;
  closing_day?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useCardConfigurations = (groupId: string) => {
  const [configurations, setConfigurations] = useState<CardConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchConfigurations = async () => {
    if (!groupId || !user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('card_configurations')
        .select('*')
        .eq('group_id', groupId)
        .order('card_name');

      if (error) throw error;
      setConfigurations(data || []);
    } catch (error) {
      console.error('Error fetching card configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConfiguration = async (config: Omit<CardConfiguration, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await (supabase as any)
        .from('card_configurations')
        .insert([
          {
            ...config,
            created_by: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setConfigurations(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating card configuration:', error);
      throw error;
    }
  };

  const updateConfiguration = async (id: string, updates: Partial<Pick<CardConfiguration, 'due_day' | 'closing_day'>>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('card_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setConfigurations(prev => 
        prev.map(config => config.id === id ? { ...config, ...data } : config)
      );
      return data;
    } catch (error) {
      console.error('Error updating card configuration:', error);
      throw error;
    }
  };

  const deleteConfiguration = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('card_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setConfigurations(prev => prev.filter(config => config.id !== id));
    } catch (error) {
      console.error('Error deleting card configuration:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, [groupId, user]);

  return {
    configurations,
    loading,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    refetch: fetchConfigurations
  };
};