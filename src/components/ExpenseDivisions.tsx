import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ExpenseSplitter } from './ExpenseSplitter';
import { DivisionManager } from './DivisionManager';
import { DivisionReport } from './DivisionReport';
import { useExpenseSplits } from '@/hooks/useExpenseSplits';

interface ExpenseDivisionsProps {
  groupId: string;
}

export const ExpenseDivisions: React.FC<ExpenseDivisionsProps> = ({ groupId }) => {
  const [currentView, setCurrentView] = useState<'list' | 'splitter' | 'report'>('list');
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const { toast } = useToast();
  const { fixExistingSplits } = useExpenseSplits(groupId);

  const handleFixDivisions = async () => {
    try {
      setIsFixing(true);
      await fixExistingSplits();
      toast({
        title: "Sucesso",
        description: "Divisões corrigidas! Os valores de pagamento foram recalculados.",
      });
    } catch (error) {
      console.error('Error fixing divisions:', error);
      toast({
        title: "Erro",
        description: "Erro ao corrigir divisões. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleOpenReport = (splitId: string) => {
    setSelectedSplitId(splitId);
    setCurrentView('report');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedSplitId(null);
  };

  if (currentView === 'report' && selectedSplitId) {
    return (
      <DivisionReport
        splitId={selectedSplitId}
        groupId={groupId}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Fix Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleFixDivisions}
          disabled={isFixing}
          variant="outline"
          size="sm"
        >
          {isFixing ? 'Corrigindo...' : 'Corrigir Cálculos das Parcelas'}
        </Button>
      </div>
      
      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as 'list' | 'splitter')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Gerenciar Divisões</TabsTrigger>
          <TabsTrigger value="splitter">Adicionar à Divisão</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <DivisionManager
            groupId={groupId}
            onOpenReport={handleOpenReport}
          />
        </TabsContent>
        
        <TabsContent value="splitter">
          <ExpenseSplitter groupId={groupId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};