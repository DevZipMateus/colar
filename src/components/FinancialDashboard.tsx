import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Plus, Upload } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { TransactionForm } from './TransactionForm';
import { ExcelImport } from './ExcelImport';
import { CategoryManagement } from './CategoryManagement';
import { CardManagement } from './CardManagement';
import { ReportGenerator } from './ReportGenerator';
import { FinancialOverview } from './FinancialOverview';
import { MonthlyExpenseView } from './MonthlyExpenseView';
import { ExpenseSplitter } from './ExpenseSplitter';

interface FinancialDashboardProps {
  groupId: string;
}

export const FinancialDashboard = ({ groupId }: FinancialDashboardProps) => {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const { summary, transactions, loading, generateReport, fetchTransactions } = useFinancialData(groupId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleGenerateReport = () => {
    const report = generateReport('full');
    navigator.clipboard.writeText(report);
  };

  const handleTransactionSuccess = () => {
    fetchTransactions();
    setShowTransactionForm(false);
  };

  const handleExcelSuccess = () => {
    fetchTransactions();
    setShowExcelImport(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Controle Financeiro</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowTransactionForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
          <Button
            onClick={() => setShowExcelImport(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Importar Excel
          </Button>
          <Button
            onClick={handleGenerateReport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Relatório
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="monthly">Controle Mensal</TabsTrigger>
          <TabsTrigger value="splits">Divisão de Gastos</TabsTrigger>
          <TabsTrigger value="cards">Cartões</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <FinancialOverview groupId={groupId} />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <MonthlyExpenseView groupId={groupId} />
        </TabsContent>

        <TabsContent value="splits" className="space-y-4">
          <ExpenseSplitter groupId={groupId} />
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <CardManagement groupId={groupId} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryManagement groupId={groupId} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportGenerator summary={summary} onGenerateReport={generateReport} />
        </TabsContent>
      </Tabs>

      {showTransactionForm && (
        <TransactionForm
          groupId={groupId}
          onClose={() => setShowTransactionForm(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}

      {showExcelImport && (
        <ExcelImport
          groupId={groupId}
          onSuccess={handleExcelSuccess}
        />
      )}
    </div>
  );
};