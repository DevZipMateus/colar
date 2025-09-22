import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ExpenseSplit {
  id: string;
  group_id: string;
  split_name: string;
  total_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'finalized' | 'cancelled';
  description?: string;
}

export interface SplitTransaction {
  id: string;
  split_id: string;
  transaction_id: string;
  created_at: string;
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
  const [splitTransactions, setSplitTransactions] = useState<SplitTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSplits = async () => {
    if (!groupId || !user) return;

    try {
      const splitsResult = await supabase
        .from('expense_splits')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (splitsResult.error) throw splitsResult.error;
      setSplits(splitsResult.data?.map(split => ({
        ...split,
        status: split.status as 'active' | 'finalized' | 'cancelled'
      })) || []);

      if (splitsResult.data && splitsResult.data.length > 0) {
        const splitIds = splitsResult.data.map(s => s.id);
        
        const [paymentsResult, transactionsResult] = await Promise.all([
          supabase
            .from('split_payments')
            .select('*')
            .in('split_id', splitIds),
          
          supabase
            .from('split_transactions')
            .select('*')
            .in('split_id', splitIds)
        ]);

        if (paymentsResult.error) throw paymentsResult.error;
        if (transactionsResult.error) throw transactionsResult.error;

        setPayments(paymentsResult.data || []);
        setSplitTransactions(transactionsResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching splits:', error);
    } finally {
      setLoading(false);
    }
  };

  const createExpenseSplit = async (
    splitName: string,
    description?: string,
    memberShares: { userId: string; amount: number }[] = []
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Create the split
      const { data: splitData, error: splitError } = await supabase
        .from('expense_splits')
        .insert({
          group_id: groupId,
          split_name: splitName,
          total_amount: 0,
          created_by: user.id,
          status: 'active',
          description: description,
        })
        .select()
        .single();

      if (splitError) throw splitError;

      // Create the split payments if provided
      if (memberShares.length > 0) {
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
        setPayments(prev => [...prev, ...paymentsData]);
      }

      setSplits(prev => [{
        ...splitData,
        status: splitData.status as 'active' | 'finalized' | 'cancelled'
      }, ...prev]);
      return splitData;
    } catch (error) {
      console.error('Error creating expense split:', error);
      throw error;
    }
  };

  const addTransactionsToSplit = async (
    splitId: string,
    transactionIds: string[]
  ) => {
    try {
      const transactionsToAdd = transactionIds.map(transactionId => ({
        split_id: splitId,
        transaction_id: transactionId,
      }));

      const { data, error } = await supabase
        .from('split_transactions')
        .insert(transactionsToAdd)
        .select();

      if (error) throw error;

      setSplitTransactions(prev => [...prev, ...data]);
      await recalculateSplitTotal(splitId);
      
      return data;
    } catch (error) {
      console.error('Error adding transactions to split:', error);
      throw error;
    }
  };

  const removeTransactionFromSplit = async (
    splitId: string,
    transactionId: string
  ) => {
    try {
      const { error } = await supabase
        .from('split_transactions')
        .delete()
        .eq('split_id', splitId)
        .eq('transaction_id', transactionId);

      if (error) throw error;

      setSplitTransactions(prev => 
        prev.filter(st => !(st.split_id === splitId && st.transaction_id === transactionId))
      );
      await recalculateSplitTotal(splitId);
    } catch (error) {
      console.error('Error removing transaction from split:', error);
      throw error;
    }
  };

  const recalculateSplitTotal = async (splitId: string) => {
    try {
      // Fetch fresh split transactions from database to ensure we have latest data
      const { data: splitTxs, error: splitTxError } = await supabase
        .from('split_transactions')
        .select('transaction_id')
        .eq('split_id', splitId);

      if (splitTxError) throw splitTxError;
      
      if (!splitTxs || splitTxs.length === 0) {
        // Update split total to 0
        const { error } = await supabase
          .from('expense_splits')
          .update({ total_amount: 0 })
          .eq('id', splitId);

        if (error) throw error;

        setSplits(prev => 
          prev.map(split => 
            split.id === splitId ? { ...split, total_amount: 0 } : split
          )
        );
        return;
      }

      // Get transaction details and sum amounts
      const { data: transactions, error: txError } = await supabase
        .from('financial_transactions')
        .select('amount')
        .in('id', splitTxs.map(st => st.transaction_id));

      if (txError) throw txError;

      const totalAmount = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      // Update split total
      const { error } = await supabase
        .from('expense_splits')
        .update({ total_amount: totalAmount })
        .eq('id', splitId);

      if (error) throw error;

      setSplits(prev => 
        prev.map(split => 
          split.id === splitId ? { ...split, total_amount: totalAmount } : split
        )
      );
    } catch (error) {
      console.error('Error recalculating split total:', error);
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
    const splitIds = splitTransactions
      .filter(st => st.transaction_id === transactionId)
      .map(st => st.split_id);
    return splits.filter(split => splitIds.includes(split.id));
  };

  const getTransactionsBySplit = (splitId: string) => {
    return splitTransactions
      .filter(st => st.split_id === splitId)
      .map(st => st.transaction_id);
  };

  const updateSplitStatus = async (splitId: string, status: 'active' | 'finalized' | 'cancelled') => {
    try {
      const { data, error } = await supabase
        .from('expense_splits')
        .update({ status })
        .eq('id', splitId)
        .select()
        .single();

      if (error) throw error;

      setSplits(prev => 
        prev.map(split => 
          split.id === splitId ? { ...split, status, updated_at: data.updated_at } : split
        )
      );

      return data;
    } catch (error) {
      console.error('Error updating split status:', error);
      throw error;
    }
  };

  const deleteSplit = async (splitId: string) => {
    try {
      // Delete split transactions first
      await supabase
        .from('split_transactions')
        .delete()
        .eq('split_id', splitId);

      // Delete split payments
      await supabase
        .from('split_payments')
        .delete()
        .eq('split_id', splitId);

      // Delete the split
      const { error } = await supabase
        .from('expense_splits')
        .delete()
        .eq('id', splitId);

      if (error) throw error;

      setSplits(prev => prev.filter(split => split.id !== splitId));
      setPayments(prev => prev.filter(payment => payment.split_id !== splitId));
      setSplitTransactions(prev => prev.filter(st => st.split_id !== splitId));
    } catch (error) {
      console.error('Error deleting split:', error);
      throw error;
    }
  };

  const getPaymentsBySplit = (splitId: string) => {
    return payments.filter(payment => payment.split_id === splitId);
  };

  useEffect(() => {
    fetchSplits();
  }, [groupId, user]);

  return {
    splits,
    payments,
    splitTransactions,
    loading,
    createExpenseSplit,
    addTransactionsToSplit,
    removeTransactionFromSplit,
    markPaymentAsSettled,
    getUserOwedAmount,
    getSplitsByTransaction,
    getTransactionsBySplit,
    getPaymentsBySplit,
    updateSplitStatus,
    deleteSplit,
    refetch: fetchSplits
  };
};