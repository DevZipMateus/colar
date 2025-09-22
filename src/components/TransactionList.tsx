import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, CreditCard, Calendar, DollarSign, ArrowUpDown, Search, Filter } from 'lucide-react';
import { useFinancialData, Transaction } from '@/hooks/useFinancialData';
import { TransactionForm } from './TransactionForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { parseDateOnly } from '@/lib/utils';

interface TransactionListProps {
  groupId: string;
}

export const TransactionList = ({ groupId }: TransactionListProps) => {
  const { transactions, loading, updateTransaction, deleteTransaction } = useFinancialData(groupId);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  
  // Filter and sort states
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCard, setFilterCard] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterExpenseType, setFilterExpenseType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return parseDateOnly(dateString).toLocaleDateString('pt-BR');
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

  const isFixedExpenseCategory = (category: string) => {
    const lowerCategory = category.toLowerCase();
    return lowerCategory.includes('aluguel') || 
           lowerCategory.includes('conta') || 
           lowerCategory.includes('assinatura') ||
           lowerCategory.includes('internet') ||
           lowerCategory.includes('luz') ||
           lowerCategory.includes('água') ||
           lowerCategory.includes('gas') ||
           lowerCategory.includes('gás');
  };

  // Get unique values for filters
  const uniqueCategories = useMemo(() => {
    const categories = [...new Set(transactions.map(t => t.category))];
    return categories.sort();
  }, [transactions]);

  const uniqueCards = useMemo(() => {
    const cards = [...new Set(transactions.map(t => t.card_name))];
    return cards.sort();
  }, [transactions]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = searchTerm === '' || 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.card_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
      const matchesCard = filterCard === 'all' || transaction.card_name === filterCard;
      const matchesType = filterType === 'all' || transaction.card_type === filterType;
      const matchesExpenseType = filterExpenseType === 'all' || 
        (filterExpenseType === 'fixed' && isFixedExpenseCategory(transaction.category)) ||
        (filterExpenseType === 'variable' && !isFixedExpenseCategory(transaction.category));
      
      return matchesSearch && matchesCategory && matchesCard && matchesType && matchesExpenseType;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'date':
        default:
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, sortBy, sortOrder, filterCategory, filterCard, filterType, filterExpenseType, searchTerm]);

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
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
            Transações ({filteredAndSortedTransactions.length} de {transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Section */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              Filtros e Ordenação
            </div>
            
            {/* Search */}
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, categoria ou cartão..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterCard} onValueChange={setFilterCard}>
                <SelectTrigger>
                  <SelectValue placeholder="Cartão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cartões</SelectItem>
                  {uniqueCards.map(card => (
                    <SelectItem key={card} value={card}>{card}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="credit">Crédito</SelectItem>
                  <SelectItem value="debit">Débito</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterExpenseType} onValueChange={setFilterExpenseType}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="fixed">Contas Fixas</SelectItem>
                  <SelectItem value="variable">Gastos Variáveis</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Data (mais recente)</SelectItem>
                  <SelectItem value="date-asc">Data (mais antigo)</SelectItem>
                  <SelectItem value="amount-desc">Valor (maior)</SelectItem>
                  <SelectItem value="amount-asc">Valor (menor)</SelectItem>
                  <SelectItem value="description-asc">Descrição (A-Z)</SelectItem>
                  <SelectItem value="description-desc">Descrição (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {filteredAndSortedTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{transactions.length === 0 ? 'Nenhuma transação encontrada' : 'Nenhuma transação corresponde aos filtros'}</p>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="block md:hidden space-y-3">
                {filteredAndSortedTransactions.map((transaction) => (
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
                       {transaction.installment_info ? (
                         <Badge variant="secondary" className="text-xs">
                           {transaction.installment_info.current_installment}/{transaction.installment_info.total_installments}
                         </Badge>
                       ) : transaction.installments && transaction.installment_number ? (
                         <Badge variant="secondary" className="text-xs">
                           {transaction.installment_number}/{transaction.installments}
                         </Badge>
                       ) : null}
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
                        <TableHead>
                          <Button variant="ghost" onClick={() => handleSort('description')} className="h-auto p-0 font-semibold">
                            Descrição <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" onClick={() => handleSort('amount')} className="h-auto p-0 font-semibold">
                            Valor <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" onClick={() => handleSort('date')} className="h-auto p-0 font-semibold">
                            Data <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Cartão</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Parcelas</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedTransactions.map((transaction) => (
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
                             {transaction.installment_info ? (
                               <span className="text-sm">
                                 {transaction.installment_info.current_installment}/{transaction.installment_info.total_installments}
                               </span>
                             ) : transaction.installments && transaction.installment_number ? (
                               <span className="text-sm">
                                 {transaction.installment_number}/{transaction.installments}
                               </span>
                             ) : (
                               <span className="text-muted-foreground">À vista</span>
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