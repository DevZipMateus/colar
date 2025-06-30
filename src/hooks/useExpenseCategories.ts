
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ExpenseCategory {
  id: string;
  group_id: string;
  name: string;
  color: string;
  icon: string | null;
  created_by: string;
  created_at: string;
}

export const useExpenseCategories = (groupId: string | null) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCategories = async () => {
    if (!user || !groupId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching expense categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error in fetchCategories:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (name: string, color: string, icon?: string) => {
    if (!user || !groupId) return { error: 'User not authenticated or no group selected' };

    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert({
          group_id: groupId,
          name,
          color,
          icon: icon || 'ShoppingCart',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        return { error: error.message };
      }

      await fetchCategories();
      return { data, error: null };
    } catch (error) {
      console.error('Error in createCategory:', error);
      return { error: 'Failed to create category' };
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error('Error deleting category:', error);
        return { error: error.message };
      }

      await fetchCategories();
      return { error: null };
    } catch (error) {
      console.error('Error in deleteCategory:', error);
      return { error: 'Failed to delete category' };
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user, groupId]);

  return {
    categories,
    loading,
    createCategory,
    deleteCategory,
    fetchCategories,
  };
};
