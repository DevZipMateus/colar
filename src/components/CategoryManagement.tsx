import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, ArrowLeft, FileText } from 'lucide-react';
import { useFinancialData, CategorySummary, Transaction } from '@/hooks/useFinancialData';
import { useInstallmentTracking } from '@/hooks/useInstallmentTracking';
import { CategoryInstallmentReport } from './CategoryInstallmentReport';

interface CategoryManagementProps {
  groupId: string;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({ groupId }) => {
  const { summary, loading } = useFinancialData(groupId);
  const { installments } = useInstallmentTracking(groupId);
  const [selectedCategory, setSelectedCategory] = useState<CategorySummary | null>(null);
  const [showInstallmentReport, setShowInstallmentReport] = useState(false);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Nenhum dado de categoria encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (value: number) => 
    `R$ ${value.toFixed(2).replace('.', ',')}`;

  const getCategoryInstallments = (category: CategorySummary) => {
    return installments.filter(inst => {
      const transaction = category.transactions.find(t => t.id === inst.transaction_id);
      return !!transaction;
    });
  };

  const CategoryDetailModal = ({ category }: { category: CategorySummary }) => {
    const categoryInstallments = getCategoryInstallments(category);
    const hasInstallments = categoryInstallments.length > 0;

    return (
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              Detalhes da Categoria: {category.name}
            </div>
            {hasInstallments && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedCategory(category);
                  setShowInstallmentReport(true);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Relatório de Parcelas
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
      
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Gasto</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(category.total)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Percentual</div>
              <div className="text-2xl font-bold text-blue-600">
                {category.percentage.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Transações</div>
              <div className="text-2xl font-bold text-green-600">
                {category.transactions.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todas as Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cartão</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Parcelas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={transaction.card_type === 'credit' ? 'default' : 'secondary'}>
                          {transaction.card_type === 'credit' ? 'Crédito' : 'Débito'}
                        </Badge>
                        {transaction.card_name}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-red-600">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      {transaction.installments ? 
                        `${transaction.installment_number}/${transaction.installments}` : 
                        'À vista'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DialogContent>
  );
};

if (showInstallmentReport && selectedCategory) {
  return (
    <CategoryInstallmentReport
      categoryName={selectedCategory.name}
      transactions={selectedCategory.transactions}
      installments={getCategoryInstallments(selectedCategory)}
      onBack={() => setShowInstallmentReport(false)}
    />
  );
}

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão por Categoria</h1>
        <div className="text-sm text-muted-foreground">
          {summary.categories.length} categorias encontradas
        </div>
      </div>

      <div className="grid gap-4">
        {summary.categories.map((category, index) => (
          <Card key={category.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.transactions.length} transação{category.transactions.length !== 1 ? 'ões' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(category.total)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {category.percentage.toFixed(1)}% do total
                    </div>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </DialogTrigger>
                    <CategoryDetailModal category={category} />
                  </Dialog>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {summary.categories.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              Nenhuma categoria encontrada para este mês.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Adicione algumas transações para começar a ver os dados organizados por categoria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};