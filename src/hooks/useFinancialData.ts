import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { parseDateOnly } from '@/lib/utils';

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
  marked_for_split?: boolean;
  split_name?: string;
  created_by: string;
  created_at: string;
  user_name?: string;
  user_avatar_url?: string;
  // Informações de parcelas vindas do installment_tracking
  installment_info?: {
    current_installment: number;
    total_installments: number;
    monthly_amount: number;
  };
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

      // Fetch installment data
      const { data: installmentData, error: installmentError } = await supabase
        .from('installment_tracking')
        .select('*')
        .eq('group_id', groupId);

      if (installmentError) {
        console.error('Error fetching installments:', installmentError);
      }

      // Fetch user profiles for all unique created_by values from both transactions and installments
      const transactionUserIds = [...new Set((transactionData || []).map(t => t.created_by))];
      const installmentUserIds = [...new Set((installmentData || []).map(i => i.created_by))];
      const uniqueUserIds = [...new Set([...transactionUserIds, ...installmentUserIds])];
      
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

      // Create installment info map
      const installmentMap = new Map();
      (installmentData || []).forEach(installment => {
        const key = installment.transaction_id;
        if (!installmentMap.has(key)) {
          installmentMap.set(key, []);
        }
        installmentMap.get(key).push(installment);
      });

      // Transform data to include user information and installment info
      const transactionsWithUsers = (transactionData || []).map(transaction => {
        const installments = installmentMap.get(transaction.id) || [];
        let installment_info = undefined;
        
        // Se tem parcelas, pegar informações da primeira parcela para exibição
        if (installments.length > 0) {
          const firstInstallment = installments[0];
          installment_info = {
            current_installment: firstInstallment.installment_number,
            total_installments: firstInstallment.total_installments,
            monthly_amount: firstInstallment.amount
          };
        }

        return {
          ...transaction,
          user_name: userMap.get(transaction.created_by)?.name || 'Usuário desconhecido',
          user_avatar_url: userMap.get(transaction.created_by)?.avatar_url,
          installment_info
        };
      });

      setTransactions(transactionsWithUsers as Transaction[]);
      calculateSummary(transactionsWithUsers as Transaction[], installmentData || [], userProfiles);
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

  const calculateSummary = (transactionData: Transaction[], installmentData: any[] = [], userProfiles: any[] = []) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Filter monthly installments (these represent the actual monthly expenses for installment purchases)
    const monthlyInstallments = installmentData.filter(installment => {
      return installment.due_month === currentMonth + 1 && installment.due_year === currentYear;
    });

    // Filter non-installment transactions (or single installments) for the current month
    const monthTransactions = transactionData.filter(t => {
      const transactionDate = parseDateOnly(t.date);
      const isCurrentMonth = transactionDate.getMonth() === currentMonth && 
                            transactionDate.getFullYear() === currentYear;
      // Only include transactions that are not multi-installment purchases
      const isNotMultiInstallment = !t.installments || t.installments <= 1;
      return isCurrentMonth && isNotMultiInstallment;
    });

    // Calculate totals from regular transactions
    const regularExpenses = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Calculate totals from installments
    const installmentExpenses = monthlyInstallments.reduce((sum, installment) => sum + Math.abs(installment.amount), 0);
    
    const totalExpenses = regularExpenses + installmentExpenses;
    // Get credit card installments
    const creditInstallments = monthlyInstallments.filter(installment => {
      const originalTransaction = transactionData.find(t => t.id === installment.transaction_id);
      return originalTransaction?.card_type === 'credit';
    });
    
    const totalCredit = monthTransactions
      .filter(t => t.card_type === 'credit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) +
      creditInstallments.reduce((sum, installment) => sum + Math.abs(installment.amount), 0);
      
    const totalDebit = monthTransactions
      .filter(t => t.card_type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const totalFixed = monthTransactions
      .filter(t => t.is_recurring)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate specific expense categories for the new breakdown
    const fixedExpenses = monthTransactions
      .filter(t => ['Aluguel', 'Contas', 'Assinaturas'].includes(t.category))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) +
      monthlyInstallments
        .filter(installment => {
          const originalTransaction = transactionData.find(t => t.id === installment.transaction_id);
          return ['Aluguel', 'Contas', 'Assinaturas'].includes(originalTransaction?.category || '');
        })
        .reduce((sum, installment) => sum + Math.abs(installment.amount), 0);

    const creditCardExpenses = totalCredit;

    const debitExpenses = totalDebit;

    // Group by categories (including installments)
    const categoryMap = new Map<string, { transactions: Transaction[], installmentAmount: number }>();
    
    // Add regular transactions
    monthTransactions.forEach(t => {
      const entry = categoryMap.get(t.category) || { transactions: [], installmentAmount: 0 };
      entry.transactions.push(t);
      categoryMap.set(t.category, entry);
    });

    // Add installment amounts by category AND create synthetic transactions for installments
    monthlyInstallments.forEach(installment => {
      const originalTransaction = transactionData.find(t => t.id === installment.transaction_id);
      if (originalTransaction) {
        const entry = categoryMap.get(originalTransaction.category) || { transactions: [], installmentAmount: 0 };
        entry.installmentAmount += Math.abs(installment.amount);
        
        // Create synthetic transaction for this installment
        const syntheticTransaction: Transaction = {
          id: `synthetic-${installment.id}`,
          group_id: originalTransaction.group_id,
          description: originalTransaction.description,
          amount: installment.amount,
          date: `${installment.due_year}-${String(installment.due_month).padStart(2, '0')}-01`,
          category: originalTransaction.category,
          card_name: originalTransaction.card_name,
          card_type: originalTransaction.card_type,
          installments: installment.total_installments,
          installment_number: installment.installment_number,
          is_recurring: originalTransaction.is_recurring,
          created_by: installment.created_by,
          created_at: installment.created_at,
          user_name: userProfiles.find(u => u.id === installment.created_by)?.name || 'Usuário desconhecido',
          user_avatar_url: userProfiles.find(u => u.id === installment.created_by)?.avatar_url,
          installment_info: {
            current_installment: installment.installment_number,
            total_installments: installment.total_installments,
            monthly_amount: installment.amount
          }
        };
        
        entry.transactions.push(syntheticTransaction);
        categoryMap.set(originalTransaction.category, entry);
      }
    });

    const categories: CategorySummary[] = Array.from(categoryMap.entries()).map(([name, data]) => {
      // Recalculate total from all transactions (regular + synthetic installments)
      const total = data.transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return {
        name,
        total,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
        transactions: data.transactions
      };
    }).sort((a, b) => b.total - a.total);

    // Group by cards (including installments) - Use ALL transactions for card management  
    const normalize = (s: string) => s.trim().toLowerCase();
    const cardMap = new Map<string, { transactions: Transaction[], installmentAmount: number, type: 'credit' | 'debit' }>();
    
    // Add ALL transactions (not just monthly) for complete card management view
    transactionData.forEach(t => {
      const normalizedCardName = normalize(t.card_name);
      const entry = cardMap.get(normalizedCardName) || { transactions: [], installmentAmount: 0, type: t.card_type };
      entry.transactions.push(t);
      cardMap.set(normalizedCardName, entry);
    });

    // Add synthetic transactions for monthly installments to cards (similar to categories)
    monthlyInstallments.forEach(installment => {
      const originalTransaction = transactionData.find(t => t.id === installment.transaction_id);
      if (originalTransaction) {
        const normalizedCardName = normalize(originalTransaction.card_name);
        
        const entry = cardMap.get(normalizedCardName) || { 
          transactions: [], 
          installmentAmount: 0, 
          type: originalTransaction.card_type 
        };
        entry.installmentAmount += Math.abs(installment.amount);
        
        // Create synthetic transaction for this installment (for reports)
        const syntheticTransaction: Transaction = {
          id: `card-installment-${installment.id}`,
          group_id: originalTransaction.group_id,
          description: originalTransaction.description,
          amount: installment.amount,
          date: `${installment.due_year}-${String(installment.due_month).padStart(2, '0')}-01`,
          category: originalTransaction.category,
          card_name: originalTransaction.card_name,
          card_type: originalTransaction.card_type,
          installments: installment.total_installments,
          installment_number: installment.installment_number,
          is_recurring: originalTransaction.is_recurring,
          created_by: installment.created_by,
          created_at: installment.created_at,
          user_name: userProfiles.find(u => u.id === installment.created_by)?.name || 'Usuário desconhecido',
          user_avatar_url: userProfiles.find(u => u.id === installment.created_by)?.avatar_url,
          installment_info: {
            current_installment: installment.installment_number,
            total_installments: installment.total_installments,
            monthly_amount: installment.amount
          }
        };
        
        entry.transactions.push(syntheticTransaction);
        cardMap.set(normalizedCardName, entry);
      } else {
        console.warn('⚠️ Original transaction not found for installment:', installment.id);
      }
    });

    const cards: CardSummary[] = Array.from(cardMap.entries()).map(([normalizedName, data]) => {
      // For card total, we want the monthly amount for monthly view, but we keep all transactions for card management
      const monthlyTransactionsForCard = data.transactions.filter(t => {
        const transactionDate = parseDateOnly(t.date);
        const isCurrentMonth = transactionDate.getMonth() === currentMonth && 
                              transactionDate.getFullYear() === currentYear;
        const isNotMultiInstallment = !t.installments || t.installments <= 1;
        return isCurrentMonth && isNotMultiInstallment;
      });
      
      const monthlyTotal = monthlyTransactionsForCard.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const total = monthlyTotal + data.installmentAmount;
      
      // Use the original card name from the first transaction for display
      const displayName = data.transactions.length > 0 ? data.transactions[0].card_name : normalizedName;
      
      console.log(`📊 Card ${displayName} summary:`, {
        monthlyTransactions: monthlyTotal,
        installments: data.installmentAmount,
        total: total,
        transactionCount: monthlyTransactionsForCard.length
      });
      
      return {
        name: displayName, // Use original display name
        type: data.type,
        total,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
        transactions: data.transactions // Keep ALL transactions for card management
      };
    }).sort((a, b) => b.total - a.total);

    // Group by users (including installments)
    const userMap = new Map<string, { transactions: Transaction[], installmentAmount: number, name: string, avatarUrl?: string }>();
    
    // Add regular transactions
    monthTransactions.forEach(t => {
      const entry = userMap.get(t.created_by) || { 
        transactions: [], 
        installmentAmount: 0, 
        name: t.user_name || 'Usuário desconhecido',
        avatarUrl: t.user_avatar_url
      };
      entry.transactions.push(t);
      userMap.set(t.created_by, entry);
    });

    // Add installment amounts by user using the userProfileMap
    const userProfileMap = new Map(userProfiles.map((user: any) => [user.id, user]));
    monthlyInstallments.forEach(installment => {
      const userProfile = userProfileMap.get(installment.created_by);
      const profileName = userProfile?.name || 'Usuário desconhecido';
      const profileAvatar = userProfile?.avatar_url;
      const entry = userMap.get(installment.created_by) || { 
        transactions: [], 
        installmentAmount: 0, 
        name: profileName,
        avatarUrl: profileAvatar
      };
      entry.installmentAmount += Math.abs(installment.amount);
      userMap.set(installment.created_by, entry);
    });

    const users: UserSummary[] = Array.from(userMap.entries()).map(([userId, data]) => {
      const transactionTotal = data.transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const total = transactionTotal + data.installmentAmount;
      return {
        user_id: userId,
        user_name: data.name,
        user_avatar_url: data.avatarUrl,
        total_spent: total,
        transaction_count: data.transactions.length,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
        transactions: data.transactions
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
        const transactionDate = parseDateOnly(transactionData.date);
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
      return { success: false, data: null };
    }

    try {
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

  const generateReport = (type: 'full' | 'card' | 'user' | 'category', cardName?: string, userId?: string, categoryName?: string) => {
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

      // Filter transactions for current month only (regular + synthetic installments)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const currentMonthTransactions = card.transactions.filter(t => {
        const transactionDate = parseDateOnly(t.date);
        const isCurrentMonth = transactionDate.getMonth() === currentMonth && 
                              transactionDate.getFullYear() === currentYear;
        
        // Include regular transactions that are not multi-installment OR synthetic installment transactions
        const isRegularOrSynthetic = (!t.installments || t.installments <= 1) || 
                                   t.id.startsWith('card-installment-') || 
                                   t.id.startsWith('synthetic-');
        
        return isCurrentMonth && isRegularOrSynthetic;
      });

      return `
RELATÓRIO DO CARTÃO: ${card.name}

💳 Tipo: ${card.type === 'credit' ? 'Crédito' : 'Débito'}
💰 Total Gasto: R$ ${card.total.toFixed(2).replace('.', ',')}
📊 Percentual do Total: ${card.percentage.toFixed(1)}%

📋 COMPRAS:
${currentMonthTransactions.map(t => {
  let installmentInfo = '';
  if (t.installments && t.installments > 1) {
    installmentInfo = ` (${t.installment_number}/${t.installments})`;
  }
  return `• ${parseDateOnly(t.date).toLocaleDateString('pt-BR')} - ${t.description}: R$ ${Math.abs(t.amount).toFixed(2).replace('.', ',')}${installmentInfo} - por ${t.user_name}`;
}).join('\n')}
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
  `• ${parseDateOnly(t.date).toLocaleDateString('pt-BR')} - ${t.description}: R$ ${t.amount.toFixed(2).replace('.', ',')} (${t.category} • ${t.card_name})`
).join('\n')}
      `.trim();
    } else if (type === 'category' && categoryName) {
      const category = summary.categories.find(c => c.name === categoryName);
      if (!category) return 'Categoria não encontrada';

      // Group by user within this category
      const userBreakdown = category.transactions.reduce((acc, transaction) => {
        const userKey = transaction.created_by;
        if (!acc[userKey]) {
          acc[userKey] = { total: 0, count: 0, name: transaction.user_name || 'Usuário desconhecido' };
        }
        acc[userKey].total += Math.abs(transaction.amount);
        acc[userKey].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number; name: string }>);

      // Group by card within this category
      const cardBreakdown = category.transactions.reduce((acc, transaction) => {
        const cardKey = transaction.card_name;
        if (!acc[cardKey]) {
          acc[cardKey] = { total: 0, count: 0 };
        }
        acc[cardKey].total += Math.abs(transaction.amount);
        acc[cardKey].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      let reportText = `RELATÓRIO DA CATEGORIA: ${categoryName}\n\n`;
      reportText += `💰 Total Gasto: R$ ${category.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      reportText += `📊 Percentual do Total: ${category.percentage.toFixed(1)}%\n`;
      reportText += `🔢 Número de Compras: ${category.transactions.length}\n\n`;

      reportText += `👥 GASTOS POR USUÁRIO NESTA CATEGORIA:\n`;
      Object.entries(userBreakdown)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([userId, data]) => {
          reportText += `• ${data.name}: R$ ${data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${data.count} compras)\n`;
        });

      reportText += `\n💳 GASTOS POR CARTÃO NESTA CATEGORIA:\n`;
      Object.entries(cardBreakdown)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([cardName, data]) => {
          reportText += `• ${cardName}: R$ ${data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${data.count} compras)\n`;
        });

      reportText += `\n📋 TODAS AS COMPRAS:\n`;
      category.transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .forEach(transaction => {
          const formattedDate = parseDateOnly(transaction.date).toLocaleDateString('pt-BR');
          let installmentInfo = '';
          if (transaction.installments && transaction.installments > 1) {
            installmentInfo = ` • parcela ${transaction.installment_number}/${transaction.installments}`;
          }
          reportText += `• ${formattedDate} - ${transaction.description}: R$ ${Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${installmentInfo} (${transaction.card_name} • por ${transaction.user_name || 'Usuário desconhecido'})\n`;
        });

      return reportText;
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