import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Split, Users, DollarSign, CheckCircle } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useExpenseSplits } from '@/hooks/useExpenseSplits';
import { useGroupMembers } from '@/hooks/useGroupMembers';
import { toast } from '@/hooks/use-toast';

interface ExpenseSplitterProps {
  groupId: string;
}

export const ExpenseSplitter = ({ groupId }: ExpenseSplitterProps) => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [splitName, setSplitName] = useState('');
  const [memberShares, setMemberShares] = useState<Record<string, number>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { transactions } = useFinancialData(groupId);
  const { splits, payments, createExpenseSplit, markPaymentAsSettled, getUserOwedAmount } = useExpenseSplits(groupId);
  const { members } = useGroupMembers(groupId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleTransactionSelect = (transactionId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
    }
  };

  const getTotalSelectedAmount = () => {
    return selectedTransactions.reduce((total, transactionId) => {
      const transaction = transactions.find(t => t.id === transactionId);
      return total + (transaction?.amount || 0);
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
    if (selectedTransactions.length === 0 || !splitName.trim()) {
      toast({
        title: "Erro",
        description: "Selecione transações e digite um nome para a divisão",
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
      const memberSharesArray = Object.entries(memberShares)
        .filter(([_, amount]) => amount > 0)
        .map(([userId, amount]) => ({ userId, amount }));

      // Create a split for each selected transaction
      for (const transactionId of selectedTransactions) {
        const transaction = transactions.find(t => t.id === transactionId);
        if (transaction) {
          await createExpenseSplit(
            transactionId,
            `${splitName} - ${transaction.description}`,
            transaction.amount,
            memberSharesArray.map(share => ({
              userId: share.userId,
              amount: (share.amount / totalAmount) * transaction.amount
            }))
          );
        }
      }

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

      {/* Create New Split */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Divisão de Gastos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Nova Divisão de Gastos
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Divisão de Gastos</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Transaction Selection */}
                <div>
                  <Label className="text-base font-medium">Selecionar Transações</Label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {transactions.slice(0, 20).map(transaction => (
                      <div key={transaction.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={transaction.id}
                          checked={selectedTransactions.includes(transaction.id)}
                          onCheckedChange={(checked) => 
                            handleTransactionSelect(transaction.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={transaction.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between">
                            <span>{transaction.description}</span>
                            <span className="font-medium">
                              {formatCurrency(transaction.amount)}
                            </span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  {selectedTransactions.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium">
                        Total selecionado: {formatCurrency(getTotalSelectedAmount())}
                      </p>
                    </div>
                  )}
                </div>

                {/* Split Name */}
                <div>
                  <Label htmlFor="splitName">Nome da Divisão</Label>
                  <Input
                    id="splitName"
                    value={splitName}
                    onChange={(e) => setSplitName(e.target.value)}
                    placeholder="Ex: Compras do mercado"
                  />
                </div>

                {/* Member Shares */}
                {selectedTransactions.length > 0 && (
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
                    
                    <div className="space-y-3">
                      {members.map(member => (
                        <div key={member.id} className="flex items-center gap-3">
                          <div className="flex-1">
                            <Label>{member.profiles?.name || 'Membro'}</Label>
                          </div>
                          <div className="w-32">
                            <Input
                              type="number"
                              step="0.01"
                              value={memberShares[member.user_id] || ''}
                              onChange={(e) => handleCustomShare(member.user_id, e.target.value)}
                              placeholder="0,00"
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
                )}

                <Separator />

                <Button 
                  onClick={handleCreateSplit}
                  disabled={selectedTransactions.length === 0 || !splitName.trim()}
                  className="w-full"
                >
                  Criar Divisão
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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