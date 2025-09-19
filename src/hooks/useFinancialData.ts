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
  topCategories: CategorySummary[];
  topCard: CardSummary | null;
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
      const { data, error } = await (supabase as any)
        .from('financial_transactions')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false });

      if (error) throw error;

      setTransactions((data as Transaction[]) || []);
      calculateSummary((data as Transaction[]) || []);
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
      topCategories: categories.slice(0, 3),
      topCard: cards.length > 0 ? cards[0] : null
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

  const parseCSVData = (csvContent: string) => {
    // Parse CSV logic will be implemented here
    // This will extract transactions from the CSV format
    console.log('CSV parsing to be implemented', csvContent);
  };

  const generateReport = (type: 'full' | 'card', cardName?: string) => {
    if (!summary) return '';

    if (type === 'full') {
      return `
RELATÓRIO FINANCEIRO - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}

💰 RESUMO GERAL
Total de Gastos: R$ ${summary.totalExpenses.toFixed(2).replace('.', ',')}
Gastos no Crédito: R$ ${summary.totalCredit.toFixed(2).replace('.', ',')}
Gastos no Débito: R$ ${summary.totalDebit.toFixed(2).replace('.', ',')}
Gastos Fixos: R$ ${summary.totalFixed.toFixed(2).replace('.', ',')}

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
  `• ${new Date(t.date).toLocaleDateString('pt-BR')} - ${t.description}: R$ ${t.amount.toFixed(2).replace('.', ',')}${t.installments ? ` (${t.installment_number}/${t.installments})` : ''}`
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
    parseCSVData,
    generateReport,
    fetchTransactions
  };
};