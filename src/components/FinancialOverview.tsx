import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useIncomeEntries } from '@/hooks/useIncomeEntries';
import { IncomeForm } from './IncomeForm';

interface FinancialOverviewProps {
  groupId: string;
}

export const FinancialOverview = ({ groupId }: FinancialOverviewProps) => {
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const { summary, loading: financialLoading } = useFinancialData(groupId);
  const { getTotalIncome, loading: incomeLoading, refetch: refetchIncome } = useIncomeEntries(groupId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (financialLoading || incomeLoading) {
    return <div>Carregando...</div>;
  }

  if (!summary) {
    return <div>Nenhum dado financeiro encontrado.</div>;
  }

  const totalIncome = getTotalIncome();
  const totalExpenses = summary.totalExpenses;
  const balance = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Income Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Entradas do Mês</CardTitle>
            <Button
              onClick={() => setShowIncomeForm(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Entrada
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totalIncome)}
          </div>
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Fixos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-orange-600">
              {formatCurrency(summary.fixedExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Cartões de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-red-600">
              {formatCurrency(summary.creditCardExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gastos do Mês (Débito)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-blue-600">
              {formatCurrency(summary.debitExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-red-700 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Total de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-sm text-red-600 mt-1">
              Soma de tudo que você terá que pagar no mês
            </p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${balance >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              <DollarSign className="h-5 w-5" />
              SALDO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatCurrency(balance)}
            </div>
            <p className={`text-sm mt-1 ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {balance >= 0 ? 'Você está no azul!' : 'Atenção: saldo negativo'}
            </p>
          </CardContent>
        </Card>
      </div>

      <IncomeForm
        groupId={groupId}
        open={showIncomeForm}
        onOpenChange={setShowIncomeForm}
        onSuccess={refetchIncome}
      />
    </div>
  );
};