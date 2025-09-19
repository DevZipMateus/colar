import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Eye, Calendar, Settings, FileText, Plus } from 'lucide-react';
import { useFinancialData, CardSummary } from '@/hooks/useFinancialData';
import { useCardConfigurations } from '@/hooks/useCardConfigurations';
import { toast } from '@/hooks/use-toast';

interface CardManagementProps {
  groupId: string;
}

export const CardManagement: React.FC<CardManagementProps> = ({ groupId }) => {
  const { summary, loading, generateReport } = useFinancialData(groupId);
  const { configurations, createConfiguration, updateConfiguration } = useCardConfigurations(groupId);
  const [selectedCard, setSelectedCard] = useState<CardSummary | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    card_name: '',
    card_type: 'credit' as 'credit' | 'debit',
    due_day: '',
    closing_day: ''
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
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
            <p className="text-center text-muted-foreground">Nenhum dado de cartão encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (value: number) => 
    `R$ ${value.toFixed(2).replace('.', ',')}`;

  const handleAddCard = async () => {
    try {
      await createConfiguration({
        group_id: groupId,
        card_name: formData.card_name,
        card_type: formData.card_type,
        due_day: formData.due_day ? parseInt(formData.due_day) : undefined,
        closing_day: formData.closing_day ? parseInt(formData.closing_day) : undefined,
      });
      
      toast({
        title: "Cartão adicionado",
        description: "Configuração do cartão criada com sucesso.",
      });
      
      setShowAddCard(false);
      setFormData({ card_name: '', card_type: 'credit', due_day: '', closing_day: '' });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o cartão.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCard = async (cardId: string) => {
    try {
      await updateConfiguration(cardId, {
        due_day: formData.due_day ? parseInt(formData.due_day) : undefined,
        closing_day: formData.closing_day ? parseInt(formData.closing_day) : undefined,
      });
      
      toast({
        title: "Cartão atualizado",
        description: "Configuração do cartão atualizada com sucesso.",
      });
      
      setEditingCard(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cartão.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateCardReport = (cardName: string) => {
    const report = generateReport('card', cardName);
    navigator.clipboard.writeText(report);
    toast({
      title: "Relatório copiado",
      description: "O relatório do cartão foi copiado para a área de transferência.",
    });
  };

  const handleSendToWhatsApp = (cardName: string) => {
    const report = generateReport('card', cardName);
    const encodedReport = encodeURIComponent(report);
    const whatsappUrl = `https://wa.me/?text=${encodedReport}`;
    window.open(whatsappUrl, '_blank');
  };

  const CardDetailModal = ({ card }: { card: CardSummary }) => {
    const config = configurations.find(c => c.card_name === card.name);
    
    return (
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Detalhes do Cartão: {card.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Resumo do Cartão */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Gasto</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(card.total)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Percentual</div>
                <div className="text-2xl font-bold text-blue-600">
                  {card.percentage.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Transações</div>
                <div className="text-2xl font-bold text-green-600">
                  {card.transactions.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Tipo</div>
                <div className="text-xl font-bold">
                  <Badge variant={card.type === 'credit' ? 'default' : 'secondary'}>
                    {card.type === 'credit' ? 'Crédito' : 'Débito'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configurações do Cartão (apenas para crédito) */}
          {card.type === 'credit' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações do Cartão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dia de Vencimento da Fatura</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg font-semibold">
                        Dia {config?.due_day || 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dia de Fechamento da Fatura</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg font-semibold">
                        Dia {config?.closing_day || 'Não configurado'}
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (config) {
                      setFormData({
                        card_name: config.card_name,
                        card_type: config.card_type,
                        due_day: config.due_day?.toString() || '',
                        closing_day: config.closing_day?.toString() || '',
                      });
                      setEditingCard(config.id);
                    }
                  }}
                  className="w-full md:w-auto"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Editar Configurações
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Relatórios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleGenerateCardReport(card.name)}
                >
                  📋 Copiar Relatório
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleSendToWhatsApp(card.name)}
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                >
                  📱 Enviar no WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Transações */}
          <Card>
            <CardHeader>
              <CardTitle>Transações do Cartão</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Parcelas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {card.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão por Cartão</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {summary.cards.length} cartão{summary.cards.length !== 1 ? 'ões' : ''} encontrado{summary.cards.length !== 1 ? 's' : ''}
          </div>
          <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Cartão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cartão</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="card-name">Nome do Cartão</Label>
                  <Input
                    id="card-name"
                    value={formData.card_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, card_name: e.target.value }))}
                    placeholder="Ex: Nubank, Itaú, etc."
                  />
                </div>
                <div>
                  <Label>Tipo do Cartão</Label>
                  <Select value={formData.card_type} onValueChange={(value: 'credit' | 'debit') => 
                    setFormData(prev => ({ ...prev, card_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Crédito</SelectItem>
                      <SelectItem value="debit">Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="due-day">Dia do Vencimento</Label>
                  <Input
                    id="due-day"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.due_day}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_day: e.target.value }))}
                    placeholder="Ex: 10"
                  />
                </div>
                <div>
                  <Label htmlFor="closing-day">Dia do Fechamento</Label>
                  <Input
                    id="closing-day"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.closing_day}
                    onChange={(e) => setFormData(prev => ({ ...prev, closing_day: e.target.value }))}
                    placeholder="Ex: 5"
                  />
                </div>
                <Button onClick={handleAddCard} className="w-full">
                  Adicionar Cartão
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {summary.cards.map((card) => {
          const config = configurations.find(c => c.card_name === card.name);
          const percentage = summary.totalExpenses > 0 ? (card.total / summary.totalExpenses) * 100 : 0;
          
          return (
            <Card key={card.name} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{card.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={card.type === 'credit' ? 'default' : 'secondary'}>
                          {card.type === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {card.transactions.length} transação{card.transactions.length !== 1 ? 'ões' : ''}
                        </span>
                      </div>
                      {config && (
                        <div className="flex items-center text-sm text-muted-foreground mt-2">
                          <Calendar className="w-4 h-4 mr-1" />
                          {config.due_day && `Venc: ${config.due_day}`}
                          {config.due_day && config.closing_day && ' • '}
                          {config.closing_day && `Fech: ${config.closing_day}`}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(card.total)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}% do total
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <CardDetailModal card={card} />
                    </Dialog>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Card Settings Modal */}
      {editingCard && (
        <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurações do Cartão</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-due-day">Dia de Vencimento da Fatura</Label>
                <Input
                  id="edit-due-day"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.due_day}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_day: e.target.value }))}
                  placeholder="Ex: 15"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-closing-day">Dia de Fechamento da Fatura</Label>
                <Input
                  id="edit-closing-day"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.closing_day}
                  onChange={(e) => setFormData(prev => ({ ...prev, closing_day: e.target.value }))}
                  placeholder="Ex: 10"
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingCard(null)}>
                  Cancelar
                </Button>
                <Button onClick={() => handleUpdateCard(editingCard)}>
                  Salvar Configurações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {summary.cards.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              Nenhum cartão encontrado para este mês.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Adicione algumas transações para começar a ver os dados organizados por cartão.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};