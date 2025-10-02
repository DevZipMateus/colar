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
  due_date?: string | null;
  notes?: string | null;
}

export interface BillStats {
  totalPending: number;
  totalOverdue: number;
  totalUpcoming: number;
  totalPaid: number;
  countPending: number;
  countOverdue: number;
  countUpcoming: number;
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

  const getPendingBills = () => {
    return billPayments.filter(b => !b.is_paid);
  };

  const getOverdueBills = () => {
    const today = new Date();
    return billPayments.filter(b => {
      if (b.is_paid) return false;
      if (!b.due_date) return false;
      return new Date(b.due_date) < today;
    });
  };

  const getUpcomingBills = (days: number = 7) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return billPayments.filter(b => {
      if (b.is_paid) return false;
      if (!b.due_date) return false;
      const dueDate = new Date(b.due_date);
      return dueDate >= today && dueDate <= futureDate;
    });
  };

  const getBillsStats = (): BillStats => {
    const pending = getPendingBills();
    const overdue = getOverdueBills();
    const upcoming = getUpcomingBills(7);
    const paid = billPayments.filter(b => b.is_paid);

    return {
      totalPending: pending.reduce((sum, b) => sum + Number(b.amount), 0),
      totalOverdue: overdue.reduce((sum, b) => sum + Number(b.amount), 0),
      totalUpcoming: upcoming.reduce((sum, b) => sum + Number(b.amount), 0),
      totalPaid: paid.reduce((sum, b) => sum + Number(b.amount), 0),
      countPending: pending.length,
      countOverdue: overdue.length,
      countUpcoming: upcoming.length
    };
  };

  const generateUpcomingBills = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('generate_upcoming_card_bills', {
        p_group_id: groupId,
        p_months_ahead: 3
      });

      if (error) throw error;
      
      toast.success('Faturas futuras geradas com sucesso!');
      await fetchBillPayments();
    } catch (error) {
      console.error('Error generating upcoming bills:', error);
      toast.error('Erro ao gerar faturas futuras');
    }
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
    getPendingBills,
    getOverdueBills,
    getUpcomingBills,
    getBillsStats,
    generateUpcomingBills,
    refetch: fetchBillPayments
  };
};