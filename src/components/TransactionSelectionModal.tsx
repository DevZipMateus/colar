import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, CreditCard, Calendar, DollarSign } from 'lucide-react';
import { parseDateOnly } from '@/lib/utils';

interface ParsedTransaction {
  description: string;
  amount: number;
  date: string;
  category: string;
  card_name: string;
  card_type: 'credit' | 'debit';
  installments?: number;
  installment_number?: number;
}

interface TransactionSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: ParsedTransaction[];
  onConfirm: (selectedTransactions: ParsedTransaction[]) => void;
  onCancel: () => void;
}

export const TransactionSelectionModal = ({
  open,
  onOpenChange,
  transactions,
  onConfirm,
  onCancel
}: TransactionSelectionModalProps) => {
  const [selectedTransactions, setSelectedTransactions] = useState<boolean[]>(
    new Array(transactions.length).fill(true)
  );
  const [importing, setImporting] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return parseDateOnly(dateString).toLocaleDateString('pt-BR');
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedTransactions(new Array(transactions.length).fill(checked));
  };

  const handleSelectTransaction = (index: number, checked: boolean) => {
    const newSelection = [...selectedTransactions];
    newSelection[index] = checked;
    setSelectedTransactions(newSelection);
  };

  const handleConfirm = async () => {
    setImporting(true);
    const selected = transactions.filter((_, index) => selectedTransactions[index]);
    await onConfirm(selected);
    setImporting(false);
  };

  const selectedCount = selectedTransactions.filter(Boolean).length;
  const totalValue = transactions
    .filter((_, index) => selectedTransactions[index])
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const creditValue = transactions
    .filter((transaction, index) => selectedTransactions[index] && transaction.card_type === 'credit')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const debitValue = transactions
    .filter((transaction, index) => selectedTransactions[index] && transaction.card_type === 'debit')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Selecionar Transações para Importar
          </DialogTitle>
          <DialogDescription>
            Escolha quais transações você deseja importar para o sistema
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Selecionado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {selectedCount}
              </div>
              <p className="text-xs text-muted-foreground">
                de {transactions.length} transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalValue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Crédito</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(creditValue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Débito</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(debitValue)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selection Controls */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedCount === transactions.length}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Selecionar todas ({transactions.length})
            </label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSelectAll(false)}
          >
            Desmarcar todas
          </Button>
        </div>

        {/* Transaction Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedCount === transactions.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Cartão</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Parcelas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow key={index} className={selectedTransactions[index] ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTransactions[index]}
                      onCheckedChange={(checked) => handleSelectTransaction(index, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {transaction.description}
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${
                      transaction.card_type === 'credit' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(transaction.date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {transaction.card_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.card_type === 'credit' ? 'destructive' : 'default'}>
                      {transaction.card_type === 'credit' ? 'Crédito' : 'Débito'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {transaction.installments && transaction.installment_number ? (
                      <span className="text-sm">
                        {transaction.installment_number}/{transaction.installments}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onCancel} disabled={importing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={importing || selectedCount === 0}>
            {importing ? 'Importando...' : `Importar ${selectedCount} transações`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};