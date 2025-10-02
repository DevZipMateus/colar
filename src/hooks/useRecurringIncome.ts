import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RecurringIncome {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  day_of_month: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useRecurringIncome = (groupId: string) => {
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchRecurringIncomes = async () => {
    if (!groupId || !user) return;

    try {
      const { data, error } = await supabase
        .from('recurring_income')
        .select('*')
        .eq('group_id', groupId)
        .order('day_of_month', { ascending: true });

      if (error) throw error;
      setRecurringIncomes(data || []);
    } catch (error) {
      console.error('Error fetching recurring incomes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRecurringIncome = async (income: Omit<RecurringIncome, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('recurring_income')
        .insert([
          {
            ...income,
            created_by: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setRecurringIncomes(prev => [...prev, data].sort((a, b) => a.day_of_month - b.day_of_month));
      return data;
    } catch (error) {
      console.error('Error adding recurring income:', error);
      throw error;
    }
  };

  const updateRecurringIncome = async (id: string, updates: Partial<Omit<RecurringIncome, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'group_id'>>) => {
    try {
      const { data, error } = await supabase
        .from('recurring_income')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setRecurringIncomes(prev => 
        prev.map(income => income.id === id ? { ...income, ...data } : income)
      );
      return data;
    } catch (error) {
      console.error('Error updating recurring income:', error);
      throw error;
    }
  };

  const deleteRecurringIncome = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recurring_income')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRecurringIncomes(prev => prev.filter(income => income.id !== id));
    } catch (error) {
      console.error('Error deleting recurring income:', error);
      throw error;
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateRecurringIncome(id, { is_active: isActive });
  };

  useEffect(() => {
    fetchRecurringIncomes();
  }, [groupId, user]);

  return {
    recurringIncomes,
    loading,
    addRecurringIncome,
    updateRecurringIncome,
    deleteRecurringIncome,
    toggleActive,
    refetch: fetchRecurringIncomes
  };
};
