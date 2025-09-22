import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseSplitter } from './ExpenseSplitter';
import { DivisionManager } from './DivisionManager';
import { DivisionReport } from './DivisionReport';

interface ExpenseDivisionsProps {
  groupId: string;
}

export const ExpenseDivisions: React.FC<ExpenseDivisionsProps> = ({ groupId }) => {
  const [currentView, setCurrentView] = useState<'list' | 'splitter' | 'report'>('list');
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null);

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
  );
};