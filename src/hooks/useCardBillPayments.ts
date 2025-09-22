import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CardBillPayment {
  id: string;
  group_id: string;
  card_name: string;
  month: number;
  year: number;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  paid_by: string;
  created_at: string;
  updated_at: string;
}

export const useCardBillPayments = (groupId: string) => {
  const [billPayments, setBillPayments] = useState<CardBillPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBillPayments = async () => {
    if (!user || !groupId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('card_bill_payments')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBillPayments(data || []);
    } catch (error) {
      console.error('Error fetching bill payments:', error);
      toast.error('Erro ao carregar pagamentos de faturas');
    } finally {
      setLoading(false);
    }
  };

  const markBillAsPaid = async (cardName: string, month: number, year: number, amount: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('card_bill_payments')
        .upsert({
          group_id: groupId,
          card_name: cardName,
          month,
          year,
          amount,
          is_paid: true,
          paid_at: new Date().toISOString(),
          paid_by: user.id
        }, {
          onConflict: 'group_id,card_name,month,year'
        });

      if (error) throw error;
      
      toast.success('Fatura marcada como paga!');
      await fetchBillPayments();
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      toast.error('Erro ao marcar fatura como paga');
    }
  };

  const markBillAsUnpaid = async (cardName: string, month: number, year: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('card_bill_payments')
        .update({
          is_paid: false,
          paid_at: null
        })
        .eq('group_id', groupId)
        .eq('card_name', cardName)
        .eq('month', month)
        .eq('year', year);

      if (error) throw error;
      
      toast.success('Fatura desmarcada como paga!');
      await fetchBillPayments();
    } catch (error) {
      console.error('Error marking bill as unpaid:', error);
      toast.error('Erro ao desmarcar fatura como paga');
    }
  };

  const getBillPaymentStatus = (cardName: string, month: number, year: number) => {
    return billPayments.find(
      payment => 
        payment.card_name === cardName && 
        payment.month === month && 
        payment.year === year &&
        payment.is_paid
    );
  };

  useEffect(() => {
    fetchBillPayments();
  }, [groupId, user]);

  return {
    billPayments,
    loading,
    markBillAsPaid,
    markBillAsUnpaid,
    getBillPaymentStatus,
    refetch: fetchBillPayments
  };
};