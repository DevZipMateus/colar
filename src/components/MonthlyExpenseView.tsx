import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, CreditCard, Calendar, CheckCircle, Users, User } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useInstallmentTracking } from '@/hooks/useInstallmentTracking';
import { useCardConfigurations } from '@/hooks/useCardConfigurations';

interface MonthlyExpenseViewProps {
  groupId: string;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MonthlyExpenseView = ({ groupId }: MonthlyExpenseViewProps) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedUser, setSelectedUser] = useState<string>('all');
  
  const { transactions, summary } = useFinancialData(groupId);
  const { installments, markInstallmentAsPaid } = useInstallmentTracking(groupId);
  const { configurations } = useCardConfigurations(groupId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const getMonthlyInstallments = () => {
    return installments.filter(
      inst => inst.due_month === selectedMonth && inst.due_year === selectedYear
    );
  };

  const getMonthlyTransactions = () => {
    const filtered = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const matchesDate = (
        transactionDate.getMonth() + 1 === selectedMonth &&
        transactionDate.getFullYear() === selectedYear
      );
      const matchesUser = selectedUser === 'all' || transaction.created_by === selectedUser;
      return matchesDate && matchesUser;
    });
    return filtered;
  };

  const getCreditCardBills = () => {
    const monthlyTransactions = getMonthlyTransactions();
    const monthlyInstallments = getMonthlyInstallments();
    
    const creditCardExpenses = monthlyTransactions.filter(t => t.card_type === 'credit');
    const installmentExpenses = monthlyInstallments;
    
    const cardTotals = new Map<string, number>();
    
    // Add regular credit card transactions
    creditCardExpenses.forEach(transaction => {
      const current = cardTotals.get(transaction.card_name) || 0;
      cardTotals.set(transaction.card_name, current + transaction.amount);
    });
    
    // Add installment payments
    installmentExpenses.forEach(installment => {
      const transaction = transactions.find(t => t.id === installment.transaction_id);
      if (transaction && transaction.card_type === 'credit') {
        const current = cardTotals.get(transaction.card_name) || 0;
        cardTotals.set(transaction.card_name, current + installment.amount);
      }
    });
    
    return Array.from(cardTotals.entries()).map(([cardName, amount]) => ({
      cardName,
      amount,
      dueDay: configurations.find(c => c.card_name === cardName)?.due_day || 10
    }));
  };

  const isCurrentMonth = selectedMonth === currentDate.getMonth() + 1 && selectedYear === currentDate.getFullYear();
  const monthlyInstallments = getMonthlyInstallments();
  const monthlyTransactions = getMonthlyTransactions();
  const creditCardBills = getCreditCardBills();

  const totalMonthlyExpenses = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0) +
    monthlyInstallments.reduce((sum, i) => sum + i.amount, 0);

  // Get unique users for filter
  const uniqueUsers = summary?.users || [];

  // Get user spending for current month and filter
  const getUserSpending = () => {
    if (!summary) return [];
    
    return summary.users.map(user => {
      const userMonthlyTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getMonth() + 1 === selectedMonth &&
          transactionDate.getFullYear() === selectedYear &&
          t.created_by === user.user_id
        );
      });
      
      const userMonthlyTotal = userMonthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      return {
        ...user,
        monthly_total: userMonthlyTotal,
        monthly_transactions: userMonthlyTransactions.length
      };
    }).filter(user => user.monthly_total > 0);
  };

  const userSpending = getUserSpending();

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-bold">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </h2>
            {isCurrentMonth && (
              <Badge variant="default" className="ml-2">
                Mês Atual
              </Badge>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total do Mês</p>
          <p className="text-2xl font-bold">{formatCurrency(totalMonthlyExpenses)}</p>
        </div>
      </div>

      {/* User Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtrar por usuário:</span>
        </div>
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os usuários" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os usuários</SelectItem>
            {uniqueUsers.map((user) => (
              <SelectItem key={user.user_id} value={user.user_id}>
                {user.user_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* User Spending Summary */}
      {userSpending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gastos por Usuário - {MONTHS[selectedMonth - 1]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userSpending.map((user) => (
                <div
                  key={user.user_id}
                  className="p-4 rounded-lg border bg-muted/50"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_avatar_url} />
                      <AvatarFallback>
                        {user.user_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{user.user_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {user.monthly_transactions} transações
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(user.monthly_total)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Card Bills */}
      {creditCardBills.length > 0 && (
        <Card className={isCurrentMonth ? "border-primary shadow-md" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Faturas de Cartões de Crédito
              {isCurrentMonth && (
                <Badge variant="destructive" className="ml-2">
                  Vencendo este mês
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {creditCardBills.map(bill => (
                <div
                  key={bill.cardName}
                  className={`p-4 rounded-lg border ${
                    isCurrentMonth ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{bill.cardName}</h4>
                    <Badge variant="outline">
                      Vence dia {bill.dueDay}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(bill.amount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installments */}
      {monthlyInstallments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parcelas do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyInstallments.map(installment => {
                const transaction = transactions.find(t => t.id === installment.transaction_id);
                return (
                  <div
                    key={installment.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      installment.is_paid ? 'bg-green-50 border-green-200' : 'bg-background'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {transaction?.description || 'Transação não encontrada'}
                        </p>
                        {installment.is_paid && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          Parcela {installment.installment_number} de {installment.total_installments}
                          {transaction && ` • ${transaction.card_name}`}
                        </span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={installment.user_avatar_url} />
                            <AvatarFallback className="text-xs">
                              {(installment.user_name || 'U').substring(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{installment.user_name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <p className="font-bold">
                        {formatCurrency(installment.amount)}
                      </p>
                      
                      {!installment.is_paid && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markInstallmentAsPaid(installment.id)}
                        >
                          Marcar como Pago
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Monthly Transactions */}
      {monthlyTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transações do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {monthlyTransactions.map(transaction => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <p className="font-medium">{transaction.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{transaction.category} • {transaction.card_name}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={transaction.user_avatar_url} />
                          <AvatarFallback className="text-xs">
                            {(transaction.user_name || 'U').substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{transaction.user_name}</span>
                      </div>
                    </div>
                  </div>
                  <p className="font-bold">
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {monthlyTransactions.length === 0 && monthlyInstallments.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhuma despesa encontrada para {MONTHS[selectedMonth - 1]} de {selectedYear}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};