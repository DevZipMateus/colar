import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Transaction {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  card_name: string;
  card_type: 'credit' | 'debit';
  installments?: number;
  installment_number?: number;
  is_recurring?: boolean;
  created_by: string;
  created_at: string;
  user_name?: string;
  user_avatar_url?: string;
}

export interface UserSummary {
  user_id: string;
  user_name: string;
  user_avatar_url?: string;
  total_spent: number;
  transaction_count: number;
  percentage: number;
  transactions: Transaction[];
}

export interface CategorySummary {
  name: string;
  total: number;
  percentage: number;
  transactions: Transaction[];
}

export interface CardSummary {
  name: string;
  type: 'credit' | 'debit';
  total: number;
  percentage: number;
  due_date?: number;
  closing_date?: number;
  transactions: Transaction[];
}

export interface FinancialSummary {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  totalFixed: number;
  totalCredit: number;
  totalDebit: number;
  fixedExpenses: number;
  creditCardExpenses: number;
  debitExpenses: number;
  categories: CategorySummary[];
  cards: CardSummary[];
  users: UserSummary[];
  topCategories: CategorySummary[];
  topCard: CardSummary | null;
  topUser: UserSummary | null;
}

export const useFinancialData = (groupId: string | null) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchTransactions = async () => {
    if (!groupId || !user) return;

    setLoading(true);
    try {
      // Fetch transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false });

      if (transactionError) throw transactionError;

      // Fetch user profiles for all unique created_by values
      const uniqueUserIds = [...new Set((transactionData || []).map(t => t.created_by))];
      
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
      const transactionsWithUsers = (transactionData || []).map(transaction => ({
        ...transaction,
        user_name: userMap.get(transaction.created_by)?.name || 'Usuário desconhecido',
        user_avatar_url: userMap.get(transaction.created_by)?.avatar_url
      }));

      setTransactions(transactionsWithUsers as Transaction[]);
      calculateSummary(transactionsWithUsers as Transaction[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Erro ao carregar dados financeiros",
        description: "Não foi possível carregar as transações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (transactionData: Transaction[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthTransactions = transactionData.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    // Calculate totals
    const totalExpenses = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalCredit = monthTransactions
      .filter(t => t.card_type === 'credit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalDebit = monthTransactions
      .filter(t => t.card_type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalFixed = monthTransactions
      .filter(t => t.is_recurring)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate specific expense categories for the new breakdown
    const fixedExpenses = monthTransactions
      .filter(t => ['Aluguel', 'Contas', 'Assinaturas'].includes(t.category))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const creditCardExpenses = monthTransactions
      .filter(t => t.card_type === 'credit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const debitExpenses = monthTransactions
      .filter(t => t.card_type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Group by categories
    const categoryMap = new Map<string, Transaction[]>();
    monthTransactions.forEach(t => {
      const transactions = categoryMap.get(t.category) || [];
      transactions.push(t);
      categoryMap.set(t.category, transactions);
    });

    const categories: CategorySummary[] = Array.from(categoryMap.entries()).map(([name, transactions]) => {
      const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return {
        name,
        total,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
        transactions
      };
    }).sort((a, b) => b.total - a.total);

    // Group by cards
    const cardMap = new Map<string, Transaction[]>();
    monthTransactions.forEach(t => {
      const transactions = cardMap.get(t.card_name) || [];
      transactions.push(t);
      cardMap.set(t.card_name, transactions);
    });

    const cards: CardSummary[] = Array.from(cardMap.entries()).map(([name, transactions]) => {
      const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const type = transactions[0]?.card_type || 'credit';
      return {
        name,
        type,
        total,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
        transactions
      };
    }).sort((a, b) => b.total - a.total);

    // Group by users
    const userMap = new Map<string, Transaction[]>();
    monthTransactions.forEach(t => {
      const transactions = userMap.get(t.created_by) || [];
      transactions.push(t);
      userMap.set(t.created_by, transactions);
    });

    const users: UserSummary[] = Array.from(userMap.entries()).map(([userId, transactions]) => {
      const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const userName = transactions[0]?.user_name || 'Usuário desconhecido';
      const userAvatarUrl = transactions[0]?.user_avatar_url;
      return {
        user_id: userId,
        user_name: userName,
        user_avatar_url: userAvatarUrl,
        total_spent: total,
        transaction_count: transactions.length,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
        transactions
      };
    }).sort((a, b) => b.total_spent - a.total_spent);

    const summaryData: FinancialSummary = {
      totalExpenses,
      totalIncome: 0, // To be implemented with income tracking
      balance: 0, // To be calculated with income
      totalFixed,
      totalCredit,
      totalDebit,
      fixedExpenses,
      creditCardExpenses,
      debitExpenses,
      categories,
      cards,
      users,
      topCategories: categories.slice(0, 3),
      topCard: cards.length > 0 ? cards[0] : null,
      topUser: users.length > 0 ? users[0] : null
    };

    setSummary(summaryData);
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at' | 'created_by'>) => {
    if (!user || !groupId) return false;

    try {
      const { data, error } = await (supabase as any)
        .from('financial_transactions')
        .insert([{
          ...transactionData,
          group_id: groupId,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // If it's a credit card transaction with installments, create installment tracking
      if (transactionData.card_type === 'credit' && transactionData.installments && transactionData.installments > 1) {
        const transactionDate = new Date(transactionData.date);
        const startMonth = transactionDate.getMonth() + 1;
        const startYear = transactionDate.getFullYear();
        
        // This would be handled by the component that calls this function
        // by importing and using the installment tracking hook
      }

      await fetchTransactions();
      
      // Registrar atividade
      await supabase
        .from('activity_feed')
        .insert({
          group_id: groupId,
          user_id: user.id,
          activity_type: 'transaction_added',
          description: `Adicionou transação: ${transactionData.description}`,
          metadata: {
            amount: transactionData.amount,
            category: transactionData.category,
            card_name: transactionData.card_name
          }
        });

      toast({
        title: "Transação adicionada",
        description: "A transação foi adicionada com sucesso.",
      });
      return { success: true, data };
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Erro ao adicionar transação",
        description: "Não foi possível adicionar a transação.",
        variant: "destructive",
      });
      return { success: false, data: null };
    }
  };

  const updateTransaction = async (id: string, transactionData: Partial<Omit<Transaction, 'id' | 'created_at' | 'created_by'>>) => {
    if (!user || !groupId) {
      console.log('updateTransaction - No user or groupId:', { user: !!user, groupId });
      return { success: false, data: null };
    }

    try {
      console.log('updateTransaction - Starting update:', { id, transactionData });
      const { data, error } = await supabase
        .from('financial_transactions')
        .update({
          ...transactionData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('group_id', groupId)
        .select()
        .single();

      console.log('updateTransaction - Supabase response:', { data, error });

      if (error) throw error;

      await fetchTransactions();
      
      // Registrar atividade
      await supabase
        .from('activity_feed')
        .insert({
          group_id: groupId,
          user_id: user.id,
          activity_type: 'transaction_updated',
          description: `Editou transação: ${transactionData.description || 'transação'}`,
          metadata: {
            amount: transactionData.amount,
            category: transactionData.category,
            card_name: transactionData.card_name
          }
        });

      toast({
        title: "Transação atualizada",
        description: "A transação foi atualizada com sucesso.",
      });
      console.log('updateTransaction - Success:', { success: true, data });
      return { success: true, data };
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Erro ao atualizar transação",
        description: "Não foi possível atualizar a transação.",
        variant: "destructive",
      });
      return { success: false, data: null };
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user || !groupId) return false;

    try {
      // Buscar dados da transação antes de excluir para log de atividade
      const { data: transaction } = await supabase
        .from('financial_transactions')
        .select('description, amount, category')
        .eq('id', id)
        .eq('group_id', groupId)
        .single();

      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id)
        .eq('group_id', groupId);

      if (error) throw error;

      // Excluir parcelas relacionadas se existirem
      await supabase
        .from('installment_tracking')
        .delete()
        .eq('transaction_id', id)
        .eq('group_id', groupId);

      await fetchTransactions();
      
      // Registrar atividade
      if (transaction) {
        await supabase
          .from('activity_feed')
          .insert({
            group_id: groupId,
            user_id: user.id,
            activity_type: 'transaction_deleted',
            description: `Excluiu transação: ${transaction.description}`,
            metadata: {
              amount: transaction.amount,
              category: transaction.category
            }
          });
      }

      toast({
        title: "Transação excluída",
        description: "A transação foi excluída com sucesso.",
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Erro ao excluir transação",
        description: "Não foi possível excluir a transação.",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const parseCSVData = (csvContent: string) => {
    // Parse CSV logic will be implemented here
    // This will extract transactions from the CSV format
    console.log('CSV parsing to be implemented', csvContent);
  };

  const generateReport = (type: 'full' | 'card' | 'user', cardName?: string, userId?: string) => {
    if (!summary) return '';

    if (type === 'full') {
      return `
RELATÓRIO FINANCEIRO - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}

💰 RESUMO GERAL
Total de Gastos: R$ ${summary.totalExpenses.toFixed(2).replace('.', ',')}
Gastos no Crédito: R$ ${summary.totalCredit.toFixed(2).replace('.', ',')}
Gastos no Débito: R$ ${summary.totalDebit.toFixed(2).replace('.', ',')}
Gastos Fixos: R$ ${summary.totalFixed.toFixed(2).replace('.', ',')}

👥 GASTOS POR USUÁRIO
${summary.users.map((user, index) => 
  `${index + 1}. ${user.user_name}: R$ ${user.total_spent.toFixed(2).replace('.', ',')} (${user.percentage.toFixed(1)}%) - ${user.transaction_count} transações`
).join('\n')}

📊 TOP 3 CATEGORIAS
${summary.topCategories.map((cat, index) => 
  `${index + 1}. ${cat.name}: R$ ${cat.total.toFixed(2).replace('.', ',')} (${cat.percentage.toFixed(1)}%)`
).join('\n')}

💳 CARTÃO COM MAIOR GASTO
${summary.topCard ? `${summary.topCard.name}: R$ ${summary.topCard.total.toFixed(2).replace('.', ',')} (${summary.topCard.percentage.toFixed(1)}%)` : 'Nenhum cartão'}

📋 TODAS AS CATEGORIAS
${summary.categories.map(cat => 
  `• ${cat.name}: R$ ${cat.total.toFixed(2).replace('.', ',')} (${cat.percentage.toFixed(1)}%)`
).join('\n')}

💳 TODOS OS CARTÕES
${summary.cards.map(card => 
  `• ${card.name} (${card.type === 'credit' ? 'Crédito' : 'Débito'}): R$ ${card.total.toFixed(2).replace('.', ',')} (${card.percentage.toFixed(1)}%)`
).join('\n')}
      `.trim();
    } else if (type === 'card' && cardName) {
      const card = summary.cards.find(c => c.name === cardName);
      if (!card) return '';

      return `
RELATÓRIO DO CARTÃO: ${card.name}

💳 Tipo: ${card.type === 'credit' ? 'Crédito' : 'Débito'}
💰 Total Gasto: R$ ${card.total.toFixed(2).replace('.', ',')}
📊 Percentual do Total: ${card.percentage.toFixed(1)}%

📋 TRANSAÇÕES:
${card.transactions.map(t => 
  `• ${new Date(t.date).toLocaleDateString('pt-BR')} - ${t.description}: R$ ${t.amount.toFixed(2).replace('.', ',')}${t.installments ? ` (${t.installment_number}/${t.installments})` : ''} - por ${t.user_name}`
).join('\n')}
      `.trim();
    } else if (type === 'user' && userId) {
      const userSummary = summary.users.find(u => u.user_id === userId);
      if (!userSummary) return '';

      return `
RELATÓRIO DO USUÁRIO: ${userSummary.user_name}

💰 Total Gasto: R$ ${userSummary.total_spent.toFixed(2).replace('.', ',')}
📊 Percentual do Total: ${userSummary.percentage.toFixed(1)}%
🔢 Número de Transações: ${userSummary.transaction_count}

📋 TRANSAÇÕES:
${userSummary.transactions.map(t => 
  `• ${new Date(t.date).toLocaleDateString('pt-BR')} - ${t.description}: R$ ${t.amount.toFixed(2).replace('.', ',')} (${t.category} • ${t.card_name})`
).join('\n')}
      `.trim();
    }

    return '';
  };

  useEffect(() => {
    fetchTransactions();
  }, [groupId, user]);

  return {
    transactions,
    summary,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    parseCSVData,
    generateReport,
    fetchTransactions
  };
};