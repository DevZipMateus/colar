import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface InstallmentTracking {
  id: string;
  group_id: string;
  transaction_id: string;
  installment_number: number;
  total_installments: number;
  amount: number;
  due_month: number;
  due_year: number;
  is_paid: boolean;
  paid_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar_url?: string;
}

export const useInstallmentTracking = (groupId: string) => {
  const [installments, setInstallments] = useState<InstallmentTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchInstallments = async () => {
    if (!groupId || !user) return;

    try {
      // Fetch installments
      const { data: installmentData, error: installmentError } = await supabase
        .from('installment_tracking')
        .select('*')
        .eq('group_id', groupId)
        .order('due_year', { ascending: true })
        .order('due_month', { ascending: true })
        .order('installment_number', { ascending: true });

      if (installmentError) throw installmentError;

      // Fetch user profiles for all unique created_by values
      const uniqueUserIds = [...new Set((installmentData || []).map(i => i.created_by))];
      
      let userProfiles: any[] = [];
      if (uniqueUserIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', uniqueUserIds);
        
        if (!profileError) {
          userProfiles = profileData || [];
        }
      }

      // Create a map for quick user lookup
      const userMap = new Map(userProfiles.map(user => [user.id, user]));
      
      // Transform data to include user information
      const installmentsWithUsers = (installmentData || []).map(installment => ({
        ...installment,
        user_name: userMap.get(installment.created_by)?.name || 'Usuário desconhecido',
        user_avatar_url: userMap.get(installment.created_by)?.avatar_url
      }));
      
      setInstallments(installmentsWithUsers);
    } catch (error) {
      console.error('Error fetching installments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInstallments = async (
    transactionId: string,
    totalAmount: number,
    installmentCount: number,
    startMonth: number,
    startYear: number
  ) => {
    if (!user) throw new Error('User not authenticated');

    const installmentAmount = totalAmount / installmentCount;
    const installmentsToCreate = [];

    for (let i = 0; i < installmentCount; i++) {
      let month = startMonth + i;
      let year = startYear;
      
      while (month > 12) {
        month -= 12;
        year += 1;
      }

      installmentsToCreate.push({
        group_id: groupId,
        transaction_id: transactionId,
        installment_number: i + 1,
        total_installments: installmentCount,
        amount: installmentAmount,
        due_month: month,
        due_year: year,
        created_by: user.id,
      });
    }

    try {
      const { data, error } = await supabase
        .from('installment_tracking')
        .insert(installmentsToCreate)
        .select();

      if (error) throw error;
      
      setInstallments(prev => [...prev, ...data]);
      return data;
    } catch (error) {
      console.error('Error creating installments:', error);
      throw error;
    }
  };

  const markInstallmentAsPaid = async (installmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('installment_tracking')
        .update({ 
          is_paid: true, 
          paid_at: new Date().toISOString() 
        })
        .eq('id', installmentId)
        .select()
        .single();

      if (error) throw error;
      
      setInstallments(prev => 
        prev.map(inst => inst.id === installmentId ? { ...inst, ...data } : inst)
      );
      return data;
    } catch (error) {
      console.error('Error marking installment as paid:', error);
      throw error;
    }
  };

  const syncInstallments = async (
    transactionId: string,
    newInstallmentCount: number,
    totalAmount: number,
    startMonth: number,
    startYear: number
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get existing installments
      const { data: existingInstallments, error: fetchError } = await supabase
        .from('installment_tracking')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('installment_number');

      if (fetchError) throw fetchError;

      const existingCount = existingInstallments?.length || 0;
      const installmentAmount = totalAmount / newInstallmentCount;

      if (existingCount === newInstallmentCount) {
        // Just update the total_installments and amounts
        const updates = existingInstallments!.map(inst => ({
          id: inst.id,
          total_installments: newInstallmentCount,
          amount: installmentAmount
        }));

        for (const update of updates) {
          await supabase
            .from('installment_tracking')
            .update({ 
              total_installments: update.total_installments,
              amount: update.amount 
            })
            .eq('id', update.id);
        }
      } else if (existingCount < newInstallmentCount) {
        // Update existing installments
        if (existingInstallments && existingInstallments.length > 0) {
          for (const inst of existingInstallments) {
            await supabase
              .from('installment_tracking')
              .update({ 
                total_installments: newInstallmentCount,
                amount: installmentAmount 
              })
              .eq('id', inst.id);
          }
        }

        // Create missing installments
        const installmentsToCreate = [];
        for (let i = existingCount; i < newInstallmentCount; i++) {
          let month = startMonth + i;
          let year = startYear;
          
          while (month > 12) {
            month -= 12;
            year += 1;
          }

          installmentsToCreate.push({
            group_id: groupId,
            transaction_id: transactionId,
            installment_number: i + 1,
            total_installments: newInstallmentCount,
            amount: installmentAmount,
            due_month: month,
            due_year: year,
            created_by: user.id,
          });
        }

        if (installmentsToCreate.length > 0) {
          const { error: insertError } = await supabase
            .from('installment_tracking')
            .insert(installmentsToCreate);

          if (insertError) throw insertError;
        }
      } else {
        // Remove extra installments (only unpaid ones)
        const toRemove = existingInstallments!.slice(newInstallmentCount);
        const unpaidToRemove = toRemove.filter(inst => !inst.is_paid);
        
        if (unpaidToRemove.length > 0) {
          const { error: deleteError } = await supabase
            .from('installment_tracking')
            .delete()
            .in('id', unpaidToRemove.map(inst => inst.id));

          if (deleteError) throw deleteError;
        }

        // Update remaining installments
        const toKeep = existingInstallments!.slice(0, newInstallmentCount);
        for (const inst of toKeep) {
          await supabase
            .from('installment_tracking')
            .update({ 
              total_installments: newInstallmentCount,
              amount: installmentAmount 
            })
            .eq('id', inst.id);
        }
      }

      await fetchInstallments();
      return true;
    } catch (error) {
      console.error('Error syncing installments:', error);
      throw error;
    }
  };

  const getInstallmentsByMonth = (month: number, year: number) => {
    return installments.filter(
      inst => inst.due_month === month && inst.due_year === year
    );
  };

  const getUpcomingInstallments = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    return installments.filter(inst => {
      if (inst.is_paid) return false;
      if (inst.due_year > currentYear) return true;
      if (inst.due_year === currentYear && inst.due_month >= currentMonth) return true;
      return false;
    });
  };

  useEffect(() => {
    fetchInstallments();
  }, [groupId, user]);

  return {
    installments,
    loading,
    createInstallments,
    syncInstallments,
    markInstallmentAsPaid,
    getInstallmentsByMonth,
    getUpcomingInstallments,
    refetch: fetchInstallments
  };
};