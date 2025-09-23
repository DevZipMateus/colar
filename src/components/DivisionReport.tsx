import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Minus, Edit, DollarSign, Calendar, CreditCard, User, CheckCircle2, Clock, RefreshCw, Settings } from 'lucide-react';
import { differenceInMonths } from 'date-fns';
import { useExpenseSplits } from '@/hooks/useExpenseSplits';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useGroupMembers } from '@/hooks/useGroupMembers';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface DivisionReportProps {
  splitId: string;
  groupId: string;
  onBack: () => void;
}

export const DivisionReport: React.FC<DivisionReportProps> = ({ splitId, groupId, onBack }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<{ paymentId: string; amount: number } | null>(null);
  const [isCustomDivisionModalOpen, setIsCustomDivisionModalOpen] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});

  const { 
    splits, 
    payments, 
    splitTransactions, 
    removeTransactionFromSplit, 
    markPaymentAsSettled, 
    getPaymentsBySplit,
    getTransactionsBySplit,
    regeneratePaymentsForSplit
  } = useExpenseSplits(groupId);
  
  const { transactions } = useFinancialData(groupId);
  const { members } = useGroupMembers(groupId);
  const { toast } = useToast();

  const split = splits.find(s => s.id === splitId);
  const splitPayments = getPaymentsBySplit(splitId);
  const transactionIds = getTransactionsBySplit(splitId);
  
  const splitTransactionDetails = useMemo(() => {
    return transactions.filter(t => transactionIds.includes(t.id));
  }, [transactions, transactionIds]);

  const handleRemoveTransaction = async (transactionId: string) => {
    if (window.confirm('Remover esta transação da divisão?')) {
      try {
        await removeTransactionFromSplit(splitId, transactionId);
        toast({
          title: "Transação removida",
          description: "A transação foi removida da divisão.",
        });
      } catch (error) {
        console.error('Error removing transaction:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover transação. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleMarkAsPaid = async (paymentId: string, amount: number) => {
    try {
      await markPaymentAsSettled(paymentId, amount);
      toast({
        title: "Pagamento marcado",
        description: "O pagamento foi marcado como pago.",
      });
    } catch (error) {
      console.error('Error marking payment:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRecalculatePayments = async () => {
    try {
      await regeneratePaymentsForSplit(splitId);
      toast({
        title: "Recalculado com sucesso",
        description: "O total e os pagamentos foram recalculados.",
      });
    } catch (error) {
      console.error('Error recalculating payments:', error);
      toast({
        title: "Erro",
        description: "Erro ao recalcular pagamentos. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleOpenCustomDivision = () => {
    // Inicializar com os valores atuais
    const currentAmounts: Record<string, number> = {};
    splitPayments.forEach(payment => {
      currentAmounts[payment.user_id] = payment.amount_owed;
    });
    setCustomAmounts(currentAmounts);
    setIsCustomDivisionModalOpen(true);
  };

  const handleCustomAmountChange = (userId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setCustomAmounts(prev => ({
      ...prev,
      [userId]: numAmount
    }));
  };

  const handleSaveCustomDivision = async () => {
    if (!split) return;

    const totalCustom = Object.values(customAmounts).reduce((sum, amount) => sum + amount, 0);
    
    if (Math.abs(totalCustom - split.total_amount) > 0.01) {
      toast({
        title: "Erro na divisão",
        description: `A soma dos valores (${formatCurrency(totalCustom)}) deve ser igual ao total da divisão (${formatCurrency(split.total_amount)}).`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Atualizar cada pagamento individualmente
      const updatePromises = Object.entries(customAmounts).map(async ([userId, amount]) => {
        const payment = splitPayments.find(p => p.user_id === userId);
        if (payment) {
          const { error } = await supabase
            .from('split_payments')
            .update({ amount_owed: amount })
            .eq('id', payment.id);
          
          if (error) throw error;
        }
      });

      await Promise.all(updatePromises);
      
      toast({
        title: "Divisão personalizada salva",
        description: "Os valores foram atualizados com sucesso!",
      });
      
      setIsCustomDivisionModalOpen(false);
      // Forçar atualização dos dados
      window.location.reload();
      
    } catch (error) {
      console.error('Error updating custom division:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar divisão personalizada. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    return member?.profiles?.name || member?.user_id || 'Usuário desconhecido';
  };

  const getCurrentInstallmentNumber = (transactionDate: string, totalInstallments: number) => {
    const currentDate = new Date();
    const startDate = new Date(transactionDate);
    const monthsDifference = differenceInMonths(currentDate, startDate) + 1;
    
    // Garante que não passe do total de parcelas
    if (monthsDifference > totalInstallments) {
      return totalInstallments;
    }
    
    // Garante que não seja menor que 1
    if (monthsDifference < 1) {
      return 1;
    }
    
    return monthsDifference;
  };

  if (!split) {
    return <div>Divisão não encontrada</div>;
  }

  const totalPaid = splitPayments.filter(p => p.is_settled).reduce((sum, p) => sum + p.amount_paid, 0);
  const totalOwed = splitPayments.reduce((sum, p) => sum + p.amount_owed, 0);
  const remainingAmount = totalOwed - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{split.split_name}</h2>
          {split.description && (
            <p className="text-muted-foreground">{split.description}</p>
          )}
        </div>
        <Badge variant={split.status === 'active' ? 'default' : 'secondary'}>
          {split.status === 'active' ? 'Ativa' : 'Finalizada'}
        </Badge>
        {split.status === 'active' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculatePayments}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recalcular total e pagamentos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCustomDivision}
            >
              <Settings className="h-4 w-4 mr-2" />
              Ajustar valores manualmente
            </Button>
          </>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total da Divisão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(split.total_amount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Total Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Restante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(remainingAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions in Split */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Incluídas</CardTitle>
        </CardHeader>
        <CardContent>
          {splitTransactionDetails.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma transação adicionada ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {splitTransactionDetails.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{transaction.description}</h4>
                      <Badge variant="outline">{transaction.category}</Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center">
                        <CreditCard className="h-3 w-3 mr-1" />
                        {transaction.card_name}
                      </span>
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {getMemberName(transaction.created_by)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      {transaction.installments && transaction.installments > 1 ? (
                        <>
                          <span className="font-semibold">{formatCurrency(transaction.amount / transaction.installments)}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {getCurrentInstallmentNumber(transaction.date, transaction.installments)}/{transaction.installments}
                          </Badge>
                        </>
                      ) : (
                        <span className="font-semibold">{formatCurrency(transaction.amount)}</span>
                      )}
                    </div>
                    {split.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveTransaction(transaction.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {splitPayments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum pagamento configurado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {splitPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${payment.is_settled ? 'bg-green-500' : 'bg-orange-500'}`} />
                    <div>
                      <p className="font-medium">{getMemberName(payment.user_id)}</p>
                      <p className="text-sm text-muted-foreground">
                        Deve: {formatCurrency(payment.amount_owed)}
                        {payment.is_settled && (
                          <span className="text-green-600 ml-2">
                            • Pago: {formatCurrency(payment.amount_paid)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {payment.is_settled ? (
                      <Badge variant="secondary">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Pago
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsPaid(payment.id, payment.amount_owed)}
                      >
                        Marcar como Pago
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Divisão Personalizada */}
      <Dialog open={isCustomDivisionModalOpen} onOpenChange={setIsCustomDivisionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Divisão Manualmente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Total da divisão: <span className="font-semibold">{formatCurrency(split?.total_amount || 0)}</span>
            </div>
            
            {splitPayments.map((payment) => {
              const member = members.find(m => m.user_id === payment.user_id);
              const memberName = member?.profiles?.name || 'Usuário desconhecido';
              
              return (
                <div key={payment.id} className="space-y-2">
                  <Label htmlFor={`amount-${payment.user_id}`}>
                    {memberName}
                  </Label>
                  <Input
                    id={`amount-${payment.user_id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={customAmounts[payment.user_id] || 0}
                    onChange={(e) => handleCustomAmountChange(payment.user_id, e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              );
            })}
            
            <div className="text-sm">
              <span className="text-muted-foreground">Soma atual: </span>
              <span className={`font-semibold ${
                Math.abs(Object.values(customAmounts).reduce((sum, amount) => sum + amount, 0) - (split?.total_amount || 0)) > 0.01 
                  ? 'text-red-600' 
                  : 'text-green-600'
              }`}>
                {formatCurrency(Object.values(customAmounts).reduce((sum, amount) => sum + amount, 0))}
              </span>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCustomDivisionModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCustomDivision}>
                Salvar Divisão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};