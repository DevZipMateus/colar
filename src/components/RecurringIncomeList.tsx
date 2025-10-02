import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRecurringIncome, RecurringIncome } from '@/hooks/useRecurringIncome';
import { RecurringIncomeForm } from './RecurringIncomeForm';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Plus, Power, PowerOff, Calendar, DollarSign } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface RecurringIncomeListProps {
  groupId: string;
}

export const RecurringIncomeList: React.FC<RecurringIncomeListProps> = ({ groupId }) => {
  const { recurringIncomes, loading, addRecurringIncome, updateRecurringIncome, deleteRecurringIncome, toggleActive } = useRecurringIncome(groupId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<RecurringIncome | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getNextGenerationDate = (dayOfMonth: number) => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let targetMonth = currentMonth;
    let targetYear = currentYear;

    if (currentDay >= dayOfMonth) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }

    const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const actualDay = Math.min(dayOfMonth, lastDayOfTargetMonth);

    return new Date(targetYear, targetMonth, actualDay);
  };

  const handleEdit = (income: RecurringIncome) => {
    setEditingIncome(income);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setIncomeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!incomeToDelete) return;

    try {
      await deleteRecurringIncome(incomeToDelete);
      toast({
        title: "Renda recorrente excluída",
        description: "A renda recorrente foi removida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a renda recorrente.",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setIncomeToDelete(null);
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      await toggleActive(id, !currentState);
      toast({
        title: currentState ? "Renda desativada" : "Renda ativada",
        description: currentState 
          ? "A renda não será mais gerada automaticamente."
          : "A renda será gerada automaticamente.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da renda.",
        variant: "destructive"
      });
    }
  };

  const handleFormSubmit = async (incomeData: any) => {
    if (editingIncome) {
      await updateRecurringIncome(editingIncome.id, incomeData);
    } else {
      await addRecurringIncome(incomeData);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingIncome(null);
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Rendas Recorrentes</h3>
        <Button onClick={() => setFormOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nova Renda
        </Button>
      </div>

      {recurringIncomes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma renda recorrente configurada. Crie uma para gerar entradas automáticas todo mês.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {recurringIncomes.map((income) => {
            const nextDate = getNextGenerationDate(income.day_of_month);
            const isExpired = income.end_date && new Date(income.end_date) < new Date();

            return (
              <Card key={income.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{income.description}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-foreground">
                          {formatCurrency(income.amount)}
                        </span>
                        <span>• Dia {income.day_of_month}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={income.is_active && !isExpired ? "default" : "secondary"}>
                        {isExpired ? 'Expirada' : income.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {income.is_active && !isExpired && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Próxima geração: {nextDate.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}

                  {income.end_date && (
                    <div className="text-sm text-muted-foreground">
                      Termina em: {new Date(income.end_date).toLocaleDateString('pt-BR')}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(income)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(income.id, income.is_active)}
                      disabled={isExpired}
                    >
                      {income.is_active ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(income.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RecurringIncomeForm
        groupId={groupId}
        open={formOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleFormSubmit}
        editingIncome={editingIncome}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A renda recorrente será removida, mas as entradas já geradas permanecerão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
