import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, CreditCard, FileText } from 'lucide-react';
import { CategorySummary, Transaction } from '@/hooks/useFinancialData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateOnly } from '@/lib/utils';
import { useInstallmentTracking } from '@/hooks/useInstallmentTracking';
import { CategoryInstallmentReport } from './CategoryInstallmentReport';

interface CategoryDetailViewProps {
  category: CategorySummary;
  onBack: () => void;
  groupId: string;
}

export const CategoryDetailView: React.FC<CategoryDetailViewProps> = ({ category, onBack, groupId }) => {
  const [showInstallmentReport, setShowInstallmentReport] = useState(false);
  const { installments } = useInstallmentTracking(groupId);

  const formatCurrency = (value: number) => 
    `R$ ${value.toFixed(2).replace('.', ',')}`;

  const formatDate = (dateString: string) => {
    try {
      return format(parseDateOnly(dateString), "dd 'de' MMM", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getCardTypeIcon = (type: 'credit' | 'debit') => (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      type === 'credit' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
    }`}>
      <CreditCard className="w-3 h-3 mr-1" />
      {type === 'credit' ? 'Crédito' : 'Débito'}
    </div>
  );

  // Filtrar parcelas desta categoria
  const categoryInstallments = installments.filter(inst => {
    const transaction = category.transactions.find(t => t.id === inst.transaction_id);
    return !!transaction;
  });

  const hasInstallments = categoryInstallments.length > 0;

  if (showInstallmentReport) {
    return (
      <CategoryInstallmentReport
        categoryName={category.name}
        transactions={category.transactions}
        installments={categoryInstallments}
        onBack={() => setShowInstallmentReport(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{category.name}</h2>
            <p className="text-muted-foreground">
              {category.transactions.length} transação{category.transactions.length !== 1 ? 'ões' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {hasInstallments && (
            <Button variant="outline" onClick={() => setShowInstallmentReport(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Relatório de Parcelas
            </Button>
          )}
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(category.total)}
            </div>
            <div className="text-sm text-muted-foreground">
              {category.percentage.toFixed(1)}% do total mensal
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo da Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Valor Total</div>
              <div className="text-2xl font-bold">{formatCurrency(category.total)}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Média por Transação</div>
              <div className="text-2xl font-bold">
                {formatCurrency(category.total / category.transactions.length)}
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">% do Total Mensal</div>
              <div className="text-2xl font-bold">{category.percentage.toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {category.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{transaction.description}</h4>
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(transaction.date)}
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 mr-1" />
                      {transaction.card_name}
                    </div>
                    {getCardTypeIcon(transaction.card_type)}
                    {transaction.installments && (
                      <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                        {transaction.installment_number}/{transaction.installments}x
                      </div>
                    )}
                    {transaction.is_recurring && (
                      <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        Fixo
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};