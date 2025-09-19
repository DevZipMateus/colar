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
}

export const useInstallmentTracking = (groupId: string) => {
  const [installments, setInstallments] = useState<InstallmentTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchInstallments = async () => {
    if (!groupId || !user) return;

    try {
      const { data, error } = await supabase
        .from('installment_tracking')
        .select('*')
        .eq('group_id', groupId)
        .order('due_year', { ascending: true })
        .order('due_month', { ascending: true })
        .order('installment_number', { ascending: true });

      if (error) throw error;
      setInstallments(data || []);
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
    markInstallmentAsPaid,
    getInstallmentsByMonth,
    getUpcomingInstallments,
    refetch: fetchInstallments
  };
};