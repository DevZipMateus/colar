import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface IncomeEntry {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useIncomeEntries = (groupId: string) => {
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchIncomeEntries = async () => {
    if (!groupId || !user) return;

    try {
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('income_entries')
        .select('*')
        .eq('group_id', groupId)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      setIncomeEntries(data || []);
    } catch (error) {
      console.error('Error fetching income entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const addIncomeEntry = async (entry: Omit<IncomeEntry, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('income_entries')
        .insert([
          {
            ...entry,
            created_by: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setIncomeEntries(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding income entry:', error);
      throw error;
    }
  };

  const updateIncomeEntry = async (id: string, updates: Partial<Pick<IncomeEntry, 'description' | 'amount' | 'date'>>) => {
    try {
      const { data, error } = await supabase
        .from('income_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setIncomeEntries(prev => 
        prev.map(entry => entry.id === id ? { ...entry, ...data } : entry)
      );
      return data;
    } catch (error) {
      console.error('Error updating income entry:', error);
      throw error;
    }
  };

  const deleteIncomeEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('income_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setIncomeEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Error deleting income entry:', error);
      throw error;
    }
  };

  const getTotalIncome = () => {
    return incomeEntries.reduce((total, entry) => total + Number(entry.amount), 0);
  };

  useEffect(() => {
    fetchIncomeEntries();
  }, [groupId, user]);

  return {
    incomeEntries,
    loading,
    addIncomeEntry,
    updateIncomeEntry,
    deleteIncomeEntry,
    getTotalIncome,
    refetch: fetchIncomeEntries
  };
};