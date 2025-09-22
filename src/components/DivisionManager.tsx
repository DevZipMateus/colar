import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, Edit, Trash2, DollarSign, Users, CheckCircle } from 'lucide-react';
import { useExpenseSplits } from '@/hooks/useExpenseSplits';
import { useGroupMembers } from '@/hooks/useGroupMembers';
import { useToast } from '@/hooks/use-toast';
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface DivisionManagerProps {
  groupId: string;
  onOpenReport: (splitId: string) => void;
}

export const DivisionManager: React.FC<DivisionManagerProps> = ({ groupId, onOpenReport }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSplitName, setNewSplitName] = useState('');
  const [newSplitDescription, setNewSplitDescription] = useState('');
  
  const { splits, loading, createExpenseSplit, updateSplitStatus, deleteSplit, getPaymentsBySplit } = useExpenseSplits(groupId);
  const { members } = useGroupMembers(groupId);
  const { toast } = useToast();

  const handleCreateSplit = async () => {
    if (!newSplitName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para a divisão.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createExpenseSplit(newSplitName, newSplitDescription);
      setIsCreateModalOpen(false);
      setNewSplitName('');
      setNewSplitDescription('');
      toast({
        title: "Divisão criada",
        description: "Nova divisão criada com sucesso!",
      });
    } catch (error) {
      console.error('Error creating split:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar divisão. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleFinalizeSplit = async (splitId: string) => {
    try {
      await updateSplitStatus(splitId, 'finalized');
      toast({
        title: "Divisão finalizada",
        description: "A divisão foi finalizada com sucesso!",
      });
    } catch (error) {
      console.error('Error finalizing split:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar divisão. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSplit = async (splitId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta divisão?')) {
      try {
        await deleteSplit(splitId);
        toast({
          title: "Divisão excluída",
          description: "A divisão foi excluída com sucesso!",
        });
      } catch (error) {
        console.error('Error deleting split:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir divisão. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const getSplitStats = (splitId: string) => {
    const payments = getPaymentsBySplit(splitId);
    const totalPaid = payments.filter(p => p.is_settled).length;
    const totalMembers = payments.length;
    return { totalPaid, totalMembers };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Ativa</Badge>;
      case 'finalized':
        return <Badge variant="secondary">Finalizada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div>Carregando divisões...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Divisões</h2>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Divisão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Divisão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="split-name">Nome da Divisão</Label>
                <Input
                  id="split-name"
                  value={newSplitName}
                  onChange={(e) => setNewSplitName(e.target.value)}
                  placeholder="Ex: Jantar de sexta-feira"
                />
              </div>
              <div>
                <Label htmlFor="split-description">Descrição (opcional)</Label>
                <Textarea
                  id="split-description"
                  value={newSplitDescription}
                  onChange={(e) => setNewSplitDescription(e.target.value)}
                  placeholder="Detalhes sobre a divisão..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSplit}>
                  Criar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {splits.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma divisão criada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira divisão para começar a organizar gastos compartilhados.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Divisão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {splits.map((split) => {
            const stats = getSplitStats(split.id);
            return (
              <Card key={split.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {split.split_name}
                        {getStatusBadge(split.status)}
                      </CardTitle>
                      {split.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {split.description}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenReport(split.id)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      {split.status === 'active' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFinalizeSplit(split.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSplit(split.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold">{formatCurrency(split.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Participantes</p>
                      <p className="font-semibold flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {stats.totalMembers}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pagos</p>
                      <p className="font-semibold">
                        {stats.totalPaid}/{stats.totalMembers}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};