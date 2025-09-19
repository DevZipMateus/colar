import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ExpenseSplit {
  id: string;
  group_id: string;
  transaction_id: string;
  split_name: string;
  total_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SplitPayment {
  id: string;
  split_id: string;
  user_id: string;
  amount_owed: number;
  amount_paid: number;
  is_settled: boolean;
  settled_at?: string;
  created_at: string;
  updated_at: string;
}

export const useExpenseSplits = (groupId: string) => {
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [payments, setPayments] = useState<SplitPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSplits = async () => {
    if (!groupId || !user) return;

    try {
      const [splitsResult, paymentsResult] = await Promise.all([
        supabase
          .from('expense_splits')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('split_payments')
          .select('*')
          .in('split_id', splits.map(s => s.id))
      ]);

      if (splitsResult.error) throw splitsResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      setSplits(splitsResult.data || []);
      setPayments(paymentsResult.data || []);
    } catch (error) {
      console.error('Error fetching splits:', error);
    } finally {
      setLoading(false);
    }
  };

  const createExpenseSplit = async (
    transactionId: string,
    splitName: string,
    totalAmount: number,
    memberShares: { userId: string; amount: number }[]
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Create the split
      const { data: splitData, error: splitError } = await supabase
        .from('expense_splits')
        .insert({
          group_id: groupId,
          transaction_id: transactionId,
          split_name: splitName,
          total_amount: totalAmount,
          created_by: user.id,
        })
        .select()
        .single();

      if (splitError) throw splitError;

      // Create the split payments
      const paymentsToCreate = memberShares.map(share => ({
        split_id: splitData.id,
        user_id: share.userId,
        amount_owed: share.amount,
      }));

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('split_payments')
        .insert(paymentsToCreate)
        .select();

      if (paymentsError) throw paymentsError;

      setSplits(prev => [splitData, ...prev]);
      setPayments(prev => [...prev, ...paymentsData]);

      return { split: splitData, payments: paymentsData };
    } catch (error) {
      console.error('Error creating expense split:', error);
      throw error;
    }
  };

  const markPaymentAsSettled = async (paymentId: string, amountPaid: number) => {
    try {
      const { data, error } = await supabase
        .from('split_payments')
        .update({
          amount_paid: amountPaid,
          is_settled: true,
          settled_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;

      setPayments(prev =>
        prev.map(payment => payment.id === paymentId ? { ...payment, ...data } : payment)
      );

      return data;
    } catch (error) {
      console.error('Error marking payment as settled:', error);
      throw error;
    }
  };

  const getUserOwedAmount = () => {
    return payments
      .filter(payment => payment.user_id === user?.id && !payment.is_settled)
      .reduce((total, payment) => total + payment.amount_owed - payment.amount_paid, 0);
  };

  const getSplitsByTransaction = (transactionId: string) => {
    return splits.filter(split => split.transaction_id === transactionId);
  };

  const getPaymentsBySplit = (splitId: string) => {
    return payments.filter(payment => payment.split_id === splitId);
  };

  useEffect(() => {
    fetchSplits();
  }, [groupId, user, splits.length]);

  return {
    splits,
    payments,
    loading,
    createExpenseSplit,
    markPaymentAsSettled,
    getUserOwedAmount,
    getSplitsByTransaction,
    getPaymentsBySplit,
    refetch: fetchSplits
  };
};