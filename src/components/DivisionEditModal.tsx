import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExpenseSplit } from '@/hooks/useExpenseSplits';

interface DivisionEditModalProps {
  split: ExpenseSplit;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DivisionEditModal: React.FC<DivisionEditModalProps> = ({
  split,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [splitName, setSplitName] = useState(split.split_name);
  const [description, setDescription] = useState(split.description || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    if (!splitName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para a divisão.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('expense_splits')
        .update({
          split_name: splitName,
          description: description,
          updated_at: new Date().toISOString()
        })
        .eq('id', split.id);

      if (error) throw error;

      toast({
        title: "Divisão atualizada",
        description: "A divisão foi atualizada com sucesso!",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating split:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar divisão. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Divisão</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-split-name">Nome da Divisão</Label>
            <Input
              id="edit-split-name"
              value={splitName}
              onChange={(e) => setSplitName(e.target.value)}
              placeholder="Nome da divisão"
            />
          </div>
          <div>
            <Label htmlFor="edit-split-description">Descrição (opcional)</Label>
            <Textarea
              id="edit-split-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre a divisão..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};