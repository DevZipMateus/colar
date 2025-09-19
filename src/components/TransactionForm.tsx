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

interface TransactionFormProps {
  groupId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ groupId, onClose, onSuccess }) => {
  const { addTransaction } = useFinancialData(groupId);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date(),
    category: '',
    card_name: '',
    card_type: 'credit' as 'credit' | 'debit',
    installments: '',
    is_recurring: false,
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
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(formData.amount.replace(',', '.'));
      const installments = formData.installments ? parseInt(formData.installments) : undefined;

      if (installments && installments > 1) {
        // Create multiple transactions for installments
        const installmentAmount = amount / installments;
        for (let i = 1; i <= installments; i++) {
          const installmentDate = new Date(formData.date);
          installmentDate.setMonth(installmentDate.getMonth() + (i - 1));

          await addTransaction({
            group_id: groupId,
            description: `${formData.description} (${i}/${installments})`,
            amount: installmentAmount,
            date: installmentDate.toISOString().split('T')[0],
            category: formData.category,
            card_name: formData.card_name,
            card_type: formData.card_type,
            installments,
            installment_number: i,
            is_recurring: formData.is_recurring,
          });
        }
      } else {
        await addTransaction({
          group_id: groupId,
          description: formData.description,
          amount,
          date: formData.date.toISOString().split('T')[0],
          category: formData.category,
          card_name: formData.card_name,
          card_type: formData.card_type,
          is_recurring: formData.is_recurring,
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Nova Transação</CardTitle>
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
                    <SelectItem key={category} value={category}>{category}</SelectItem>
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
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};