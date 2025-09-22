import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Split, Users, DollarSign, CheckCircle, Search, Filter, Calendar, CreditCard, User, Tag } from 'lucide-react';
import { useFinancialData, Transaction } from '@/hooks/useFinancialData';
import { useExpenseSplits } from '@/hooks/useExpenseSplits';
import { useGroupMembers } from '@/hooks/useGroupMembers';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { useCardConfigurations } from '@/hooks/useCardConfigurations';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExpenseSplitterProps {
  groupId: string;
}

type DateFilter = 'all' | 'week' | 'month' | '3months' | 'custom';
type StatusFilter = 'all' | 'not_divided' | 'marked_for_split' | 'already_divided';

export const ExpenseSplitter = ({ groupId }: ExpenseSplitterProps) => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [splitName, setSplitName] = useState('');
  const [memberShares, setMemberShares] = useState<Record<string, number>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedExistingSplit, setSelectedExistingSplit] = useState<string>('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('not_divided');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cardFilter, setCardFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  const { transactions } = useFinancialData(groupId);
  const { splits, payments, splitTransactions, createExpenseSplit, addTransactionsToSplit, markPaymentAsSettled, getUserOwedAmount } = useExpenseSplits(groupId);
  const { members } = useGroupMembers(groupId);
  const { categories } = useExpenseCategories(groupId);
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getDateFilterRange = (filter: DateFilter = dateFilter) => {
    const now = new Date();
    switch (filter) {
      case 'week':
        return { start: subWeeks(now, 1), end: now };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case '3months':
        return { start: subMonths(now, 3), end: now };
      default:
        return null;
    }
  };

    const filteredTransactions = useMemo(() => {
      return transactions.filter((t) => {
        // Search filter
        if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Date filter
        const transactionDate = new Date(t.date);
        const dateRange = getDateFilterRange(dateFilter);
        if (dateRange) {
          if (transactionDate < dateRange.start || transactionDate > dateRange.end) {
            return false;
          }
        }

        // Status filter  
        const splitTxIds = splitTransactions
          .filter(st => st.transaction_id === t.id)
          .map(st => st.split_id);
        const relatedSplits = splits.filter(s => splitTxIds.includes(s.id));
        const hasBeenDivided = relatedSplits.length > 0;
        
        if (statusFilter === 'not_divided' && hasBeenDivided) {
          return false;
        }
        if (statusFilter === 'marked_for_split' && !t.marked_for_split) {
          return false;
        }
        if (statusFilter === 'already_divided' && !hasBeenDivided) {
          return false;
        }

        // Category filter
        if (categoryFilter !== 'all' && t.category !== categoryFilter) {
          return false;
        }

        // Card filter
        if (cardFilter !== 'all' && t.card_name !== cardFilter) {
          return false;
        }

        // User filter
        if (userFilter !== 'all' && t.created_by !== userFilter) {
          return false;
        }

        return true;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, searchTerm, dateFilter, statusFilter, categoryFilter, cardFilter, userFilter, splits, splitTransactions]);

  const handleTransactionSelect = (transactionId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
    }
  };

  const handleSelectAll = () => {
    setSelectedTransactions(filteredTransactions.map(t => t.id));
  };

  const handleDeselectAll = () => {
    setSelectedTransactions([]);
  };

  const getTotalSelectedAmount = () => {
    return selectedTransactions.reduce((total, transactionId) => {
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) return total;
      
      // If transaction has installments, use the installment amount
      if (transaction.installments && transaction.installments > 1) {
        const installmentAmount = transaction.amount / transaction.installments;
        return total + installmentAmount;
      }
      
      // Otherwise use the full transaction amount
      return total + transaction.amount;
    }, 0);
  };

  const handleEqualSplit = () => {
    const totalAmount = getTotalSelectedAmount();
    const amountPerPerson = totalAmount / members.length;
    
    const shares: Record<string, number> = {};
    members.forEach(member => {
      shares[member.user_id] = amountPerPerson;
    });
    
    setMemberShares(shares);
  };

  const handleCustomShare = (userId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setMemberShares(prev => ({
      ...prev,
      [userId]: numAmount
    }));
  };

  const handleCreateSplit = async () => {
    if (selectedTransactions.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma transação",
        variant: "destructive"
      });
      return;
    }

    if (selectedExistingSplit && selectedExistingSplit !== 'select') {
      // Adding to existing split
      try {
        setIsCreating(true);
        await addTransactionsToSplit(selectedExistingSplit, selectedTransactions);
        
        toast({
          title: "Sucesso",
          description: "Transações adicionadas à divisão existente!",
        });

        // Reset form
        setSelectedTransactions([]);
        setSelectedExistingSplit('');
        setShowCreateDialog(false);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao adicionar transações à divisão",
          variant: "destructive"
        });
      } finally {
        setIsCreating(false);
      }
    } else {
      // Creating new split
      if (!splitName.trim()) {
        toast({
          title: "Erro",
          description: "Digite um nome para a divisão",
          variant: "destructive"
        });
        return;
      }

      const totalAmount = getTotalSelectedAmount();
      const totalShares = Object.values(memberShares).reduce((sum, amount) => sum + amount, 0);

      if (Math.abs(totalAmount - totalShares) > 0.01) {
        toast({
          title: "Erro",
          description: "O total das cotas deve ser igual ao valor total das transações",
          variant: "destructive"
        });
        return;
      }

      try {
        setIsCreating(true);
        const memberSharesArray = Object.entries(memberShares)
          .filter(([_, amount]) => amount > 0)
          .map(([userId, amount]) => ({ userId, amount }));

        // Create the split first
        const split = await createExpenseSplit(splitName, '', memberSharesArray);
        
        // Add transactions to the split
        await addTransactionsToSplit(split.id, selectedTransactions);

        toast({
          title: "Sucesso",
          description: "Divisão de gastos criada com sucesso!",
        });

        // Reset form
        setSelectedTransactions([]);
        setSplitName('');
        setMemberShares({});
        setShowCreateDialog(false);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao criar divisão de gastos",
          variant: "destructive"
        });
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleSettlePayment = async (paymentId: string, amountOwed: number) => {
    try {
      await markPaymentAsSettled(paymentId, amountOwed);
      toast({
        title: "Sucesso",
        description: "Pagamento marcado como quitado!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao quitar pagamento",
        variant: "destructive"
      });
    }
  };

  const userOwedAmount = getUserOwedAmount();
  const unsettledSplits = splits.filter(split => 
    payments.some(payment => payment.split_id === split.id && !payment.is_settled)
  );

  const getTransactionBadges = (transaction: Transaction) => {
    const badges = [];
    
    if (transaction.marked_for_split) {
      badges.push(
        <Badge key="marked" variant="secondary" className="bg-yellow-100 text-yellow-800">
          Marcado para divisão
        </Badge>
      );
    }
    
    if (transaction.installments && transaction.installments > 1) {
      const installmentAmount = transaction.amount / transaction.installments;
      badges.push(
        <Badge key="installment" variant="outline">
          Parcela {transaction.installment_number}/{transaction.installments} - {formatCurrency(installmentAmount)}
        </Badge>
      );
    }
    
    const existingSplits = splits.filter(s => {
      const splitTxIds = splitTransactions
        .filter(st => st.split_id === s.id)
        .map(st => st.transaction_id);
      return splitTxIds.includes(transaction.id);
    });
    if (existingSplits.length > 0) {
      badges.push(
        <Badge key="divided" variant="default" className="bg-green-100 text-green-800">
          Já dividido
        </Badge>
      );
    }
    
    return badges;
  };

  // Get unique values for filters
  const uniqueCategories = [...new Set(transactions.map(t => t.category))];
  const uniqueCards = [...new Set(transactions.map(t => t.card_name))];
  const uniqueUsers = [...new Set(transactions.map(t => t.created_by))];

  return (
    <div className="space-y-6">
      {/* User's Pending Payments */}
      {userOwedAmount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <DollarSign className="h-5 w-5" />
              Seus Pagamentos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 mb-4">
              {formatCurrency(userOwedAmount)}
            </div>
            
            <div className="space-y-2">
              {payments
                .filter(payment => payment.user_id === members.find(m => m.user_id)?.user_id && !payment.is_settled)
                .map(payment => {
                  const split = splits.find(s => s.id === payment.split_id);
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <p className="font-medium">{split?.split_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(payment.amount_owed)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSettlePayment(payment.id, payment.amount_owed)}
                      >
                        Marcar como Pago
                      </Button>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label className="text-xs">Período</Label>
              <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="3months">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="not_divided">Não divididas</SelectItem>
                  <SelectItem value="marked_for_split">Marcadas</SelectItem>
                  <SelectItem value="already_divided">Já divididas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Cartão</Label>
              <Select value={cardFilter} onValueChange={setCardFilter}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueCards.map(card => (
                    <SelectItem key={card} value={card}>{card}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Usuário</Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueUsers.map(userId => {
                    const member = members.find(m => m.user_id === userId);
                    return (
                      <SelectItem key={userId} value={userId}>
                        {member?.profiles?.name || 'Usuário'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Mostrando {filteredTransactions.length} transação(ões)
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Split className="h-5 w-5" />
              Transações Disponíveis
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredTransactions.length === 0}
              >
                Selecionar Todas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                disabled={selectedTransactions.length === 0}
              >
                Desmarcar Todas
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação encontrada com os filtros aplicados.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map(transaction => {
                const member = members.find(m => m.user_id === transaction.created_by);
                const category = categories.find(c => c.name === transaction.category);
                
                return (
                  <div
                    key={transaction.id}
                    className={`border rounded-lg p-4 ${
                      selectedTransactions.includes(transaction.id) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedTransactions.includes(transaction.id)}
                        onCheckedChange={(checked) => 
                          handleTransactionSelect(transaction.id, checked as boolean)
                        }
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{transaction.description}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(transaction.date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {transaction.category}
                              </div>
                              <div className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {transaction.card_name}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {member?.profiles?.name || 'Usuário'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {formatCurrency(transaction.amount)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.card_type === 'credit' ? 'Crédito' : 'Débito'}
                            </div>
                          </div>
                        </div>
                        
                        {getTransactionBadges(transaction).length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {getTransactionBadges(transaction)}
                          </div>
                        )}
                        
                        {transaction.split_name && (
                          <div className="text-sm text-blue-600">
                            Nome sugerido para divisão: {transaction.split_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedTransactions.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">
                    {selectedTransactions.length} transação(ões) selecionada(s)
                  </p>
                  <p className="text-sm text-blue-700">
                    Total: {formatCurrency(getTotalSelectedAmount())}
                  </p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Users className="h-4 w-4 mr-2" />
                      Criar Divisão
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Criar Divisão de Gastos</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium">Resumo da Seleção</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedTransactions.length} transação(ões) • Total: {formatCurrency(getTotalSelectedAmount())}
                        </p>
                      </div>

                      {/* Option to select existing split */}
                      <div>
                        <Label>Opção de Divisão</Label>
                        <div className="mt-2 space-y-2">
                          <label className="flex items-center space-x-2">
                            <input 
                              type="radio" 
                              name="splitOption" 
                              checked={!selectedExistingSplit}
                              onChange={() => {
                                setSelectedExistingSplit('');
                                setSplitName('');
                              }}
                            />
                            <span className="text-sm">Criar nova divisão</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input 
                              type="radio" 
                              name="splitOption" 
                              checked={!!selectedExistingSplit}
                              onChange={() => setSelectedExistingSplit('select')}
                            />
                            <span className="text-sm">Adicionar à divisão existente</span>
                          </label>
                        </div>
                      </div>

                      {selectedExistingSplit ? (
                        <div>
                          <Label htmlFor="existingSplit">Selecionar Divisão</Label>
                          <Select 
                            value={selectedExistingSplit === 'select' ? '' : selectedExistingSplit} 
                            onValueChange={setSelectedExistingSplit}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Escolha uma divisão ativa" />
                            </SelectTrigger>
                            <SelectContent>
                              {splits.filter(s => s.status === 'active').map(split => (
                                <SelectItem key={split.id} value={split.id}>
                                  {split.split_name} - {formatCurrency(split.total_amount)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div>
                          <Label htmlFor="splitName">Nome da Divisão</Label>
                          <Input
                            id="splitName"
                            value={splitName}
                            onChange={(e) => setSplitName(e.target.value)}
                            placeholder="Ex: Compras do mercado"
                          />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-base font-medium">Divisão por Pessoa</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleEqualSplit}
                          >
                            Dividir Igualmente
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {members.map(member => (
                            <div key={member.id} className="flex items-center gap-3">
                              <div className="flex-1">
                                <Label className="text-sm">{member.profiles?.name || 'Membro'}</Label>
                              </div>
                              <div className="w-24">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={memberShares[member.user_id] || ''}
                                  onChange={(e) => handleCustomShare(member.user_id, e.target.value)}
                                  placeholder="0,00"
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                          <p className="text-sm">
                            Total das cotas: {formatCurrency(
                              Object.values(memberShares).reduce((sum, amount) => sum + amount, 0)
                            )}
                          </p>
                        </div>
                      </div>

                      <Button 
                        onClick={handleCreateSplit}
                        disabled={isCreating || selectedTransactions.length === 0 || (!selectedExistingSplit && !splitName.trim()) || (selectedExistingSplit === 'select')}
                        className="w-full"
                      >
                        {isCreating ? 'Processando...' : (selectedExistingSplit && selectedExistingSplit !== 'select' ? 'Adicionar à Divisão' : 'Criar Divisão')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Splits */}
      {unsettledSplits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Divisões Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unsettledSplits.map(split => {
                const splitPayments = payments.filter(p => p.split_id === split.id);
                const settledCount = splitPayments.filter(p => p.is_settled).length;
                
                return (
                  <div key={split.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{split.split_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Total: {formatCurrency(split.total_amount)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {settledCount}/{splitPayments.length} quitado
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {splitPayments.map(payment => {
                        const member = members.find(m => m.user_id === payment.user_id);
                        return (
                          <div
                            key={payment.id}
                            className={`flex items-center justify-between p-2 rounded ${
                              payment.is_settled ? 'bg-green-50' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {payment.is_settled && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                              <span className="text-sm">
                                {member?.profiles?.name || 'Membro'}
                              </span>
                            </div>
                            <span className="text-sm font-medium">
                              {formatCurrency(payment.amount_owed)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};