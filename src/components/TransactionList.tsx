import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, CreditCard, Calendar, DollarSign } from 'lucide-react';
import { useFinancialData, Transaction } from '@/hooks/useFinancialData';
import { TransactionForm } from './TransactionForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface TransactionListProps {
  groupId: string;
}

export const TransactionList = ({ groupId }: TransactionListProps) => {
  const { transactions, loading, updateTransaction, deleteTransaction } = useFinancialData(groupId);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setEditingTransaction(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando transações...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Transações ({transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="block md:hidden space-y-3">
                {transactions.map((transaction) => (
                  <Card key={transaction.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{transaction.description}</h3>
                        <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold text-sm ${
                          transaction.card_type === 'credit' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">{transaction.category}</Badge>
                      <Badge variant={transaction.card_type === 'credit' ? 'destructive' : 'default'} className="text-xs">
                        {transaction.card_type === 'credit' ? 'Crédito' : 'Débito'}
                      </Badge>
                      {transaction.installments && transaction.installment_number && (
                        <Badge variant="secondary" className="text-xs">
                          {transaction.installment_number}/{transaction.installments}
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{transaction.card_name} • {transaction.user_name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a transação "{transaction.description}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(transaction.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Cartão</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Parcelas</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
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
                          <TableCell>
                            <span className="text-sm">{transaction.user_name}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(transaction)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a transação "{transaction.description}"? 
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(transaction.id)}>
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showEditForm && editingTransaction && (
        <TransactionForm
          groupId={groupId}
          editingTransaction={editingTransaction}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};