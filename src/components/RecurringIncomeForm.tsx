import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { RecurringIncome } from '@/hooks/useRecurringIncome';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface RecurringIncomeFormProps {
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (income: any) => Promise<void>;
  editingIncome?: RecurringIncome | null;
}

export const RecurringIncomeForm: React.FC<RecurringIncomeFormProps> = ({
  groupId,
  open,
  onOpenChange,
  onSubmit,
  editingIncome
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingIncome) {
      setDescription(editingIncome.description);
      setAmount(editingIncome.amount.toString());
      setDayOfMonth(editingIncome.day_of_month.toString());
      setStartDate(editingIncome.start_date);
      setEndDate(editingIncome.end_date || '');
      setIsActive(editingIncome.is_active);
    } else {
      resetForm();
    }
  }, [editingIncome, open]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDayOfMonth('1');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setIsActive(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const day = parseInt(dayOfMonth);
    if (day < 1 || day > 31) {
      toast({
        title: "Erro",
        description: "O dia do mês deve estar entre 1 e 31",
        variant: "destructive"
      });
      return;
    }

    if (endDate && endDate < startDate) {
      toast({
        title: "Erro",
        description: "A data de término não pode ser anterior à data de início",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        group_id: groupId,
        description,
        amount: parseFloat(amount),
        day_of_month: day,
        start_date: startDate,
        end_date: endDate || null,
        is_active: isActive
      });

      toast({
        title: editingIncome ? "Renda recorrente atualizada" : "Renda recorrente criada",
        description: editingIncome 
          ? "A renda recorrente foi atualizada com sucesso."
          : "A renda será gerada automaticamente todo mês.",
      });
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a renda recorrente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const showWarning = parseInt(dayOfMonth) > 28;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingIncome ? 'Editar Renda Recorrente' : 'Nova Renda Recorrente'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Salário, Aluguel recebido"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dayOfMonth">Dia do Mês (1-31)</Label>
            <Input
              id="dayOfMonth"
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              required
            />
            {showWarning && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Em meses com menos dias, a renda será gerada no último dia do mês.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Término (Opcional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Ativa</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editingIncome ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
