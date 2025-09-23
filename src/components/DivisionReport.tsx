import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Minus, Edit, DollarSign, Calendar, CreditCard, User, CheckCircle2, Clock } from 'lucide-react';
import { useExpenseSplits } from '@/hooks/useExpenseSplits';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useGroupMembers } from '@/hooks/useGroupMembers';
import { useToast } from '@/hooks/use-toast';

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

  const { 
    splits, 
    payments, 
    splitTransactions, 
    removeTransactionFromSplit, 
    markPaymentAsSettled, 
    getPaymentsBySplit,
    getTransactionsBySplit
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

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    return member?.profiles?.name || member?.user_id || 'Usuário desconhecido';
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
                            1/{transaction.installments}
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
    </div>
  );
};