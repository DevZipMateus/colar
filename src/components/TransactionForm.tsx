import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialData, Transaction } from '@/hooks/useFinancialData';
import { useInstallmentTracking } from '@/hooks/useInstallmentTracking';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { toast } from '@/hooks/use-toast';

interface TransactionFormProps {
  groupId: string;
  editingTransaction?: Transaction;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ groupId, editingTransaction, onClose, onSuccess }) => {
  const { addTransaction, updateTransaction } = useFinancialData(groupId);
  const { createInstallments } = useInstallmentTracking(groupId);
  const [formData, setFormData] = useState({
    description: editingTransaction?.description || '',
    amount: editingTransaction?.amount?.toString() || '',
    date: editingTransaction ? new Date(editingTransaction.date) : new Date(),
    category: editingTransaction?.category || '',
    card_name: editingTransaction?.card_name || '',
    card_type: (editingTransaction?.card_type || 'credit') as 'credit' | 'debit',
    installments: editingTransaction?.installments?.toString() || '',
    is_recurring: editingTransaction?.is_recurring || false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = [
    'Assinaturas', 'Saúde', 'Necessidades', 'Presentes', 'Eletrônicos', 
    'Contas', 'Mercado', 'Transporte', 'Alimentação', 'Lazer', 'Beleza', 
    'Educação', 'Aluguel', 'Roupas'
  ];

  const cards = [
    'Nubank', 'Magalu', 'Renner', 'Carrefour', 'Inter', 'Itaú', 
    'Bradesco', 'Banco do Brasil', 'Santander', 'Débito', 'Dinheiro'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.category || !formData.card_name) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(formData.amount.replace(',', '.'));
      const installments = formData.installments ? parseInt(formData.installments) : undefined;

      const transactionData = {
        group_id: groupId,
        description: formData.description,
        amount,
        date: formData.date.toISOString().split('T')[0],
        category: formData.category,
        card_name: formData.card_name,
        card_type: formData.card_type,
        installments,
        is_recurring: formData.is_recurring,
      };

      let result;
      if (editingTransaction) {
        result = await updateTransaction(editingTransaction.id, transactionData);
      } else {
        result = await addTransaction(transactionData);
        
        // If it's a new credit card transaction with installments, create installment tracking
        if (result && typeof result === 'object' && result.success && result.data && formData.card_type === 'credit' && installments && installments > 1) {
          const transactionDate = new Date(formData.date);
          const startMonth = transactionDate.getMonth() + 1;
          const startYear = transactionDate.getFullYear();
          
          await createInstallments(
            result.data.id,
            amount,
            installments,
            startMonth,
            startYear
          );
        }
      }

      if (result && result.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição da compra"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      if (date) {
                        setFormData(prev => ({ ...prev, date }));
                        setShowDatePicker(false);
                      }
                    }}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                 <SelectContent>
                   {categories.map(category => (
                     <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                   ))}
                 </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cartão</Label>
              <Select value={formData.card_name} onValueChange={(value) => setFormData(prev => ({ ...prev, card_name: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cartão" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map(card => (
                    <SelectItem key={card} value={card}>{card}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo do Cartão</Label>
              <Select value={formData.card_type} onValueChange={(value: 'credit' | 'debit') => setFormData(prev => ({ ...prev, card_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Crédito</SelectItem>
                  <SelectItem value="debit">Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments">Parcelas (opcional)</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                max="60"
                value={formData.installments}
                onChange={(e) => setFormData(prev => ({ ...prev, installments: e.target.value }))}
                placeholder="Número de parcelas"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: !!checked }))}
              />
              <Label htmlFor="recurring">Gasto fixo/recorrente</Label>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (editingTransaction ? 'Atualizando...' : 'Salvando...') : (editingTransaction ? 'Atualizar' : 'Salvar')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};