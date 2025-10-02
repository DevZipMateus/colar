import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Plus, Upload } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { ExcelImport } from './ExcelImport';
import { CategoryManagement } from './CategoryManagement';
import { ExpenseCategoryManager } from './ExpenseCategoryManager';
import { CardManagement } from './CardManagement';
import { ReportGenerator } from './ReportGenerator';
import { FinancialOverview } from './FinancialOverview';
import { MonthlyExpenseView } from './MonthlyExpenseView';
import { ExpenseDivisions } from './ExpenseDivisions';
import { BillsDashboard } from './BillsDashboard';

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
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Controle Financeiro</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowTransactionForm(true)}
            className="flex items-center gap-2 text-sm"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Transação</span>
            <span className="sm:hidden">Nova</span>
          </Button>
          <Button
            onClick={() => setShowExcelImport(true)}
            variant="outline"
            className="flex items-center gap-2 text-sm"
            size="sm"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar Excel</span>
            <span className="sm:hidden">Importar</span>
          </Button>
          <Button
            onClick={handleGenerateReport}
            variant="outline"
            className="flex items-center gap-2 text-sm"
            size="sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Relatório</span>
            <span className="sm:hidden">Report</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 min-w-[700px] md:min-w-0">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Resumo</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs md:text-sm">Mensal</TabsTrigger>
            <TabsTrigger value="bills" className="text-xs md:text-sm">Faturas</TabsTrigger>
            <TabsTrigger value="splits" className="text-xs md:text-sm">Divisão</TabsTrigger>
            <TabsTrigger value="cards" className="text-xs md:text-sm">Cartões</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs md:text-sm">Categorias</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs md:text-sm">Relatórios</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <FinancialOverview groupId={groupId} />
          <TransactionList groupId={groupId} />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <MonthlyExpenseView groupId={groupId} />
        </TabsContent>

        <TabsContent value="bills" className="space-y-4">
          <BillsDashboard groupId={groupId} />
        </TabsContent>

        <TabsContent value="splits" className="space-y-4">
          <ExpenseDivisions groupId={groupId} />
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <CardManagement groupId={groupId} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <ExpenseCategoryManager groupId={groupId} />
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