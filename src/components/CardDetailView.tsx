import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, CreditCard, Edit2, Save, X, Copy, Share } from 'lucide-react';
import { CardSummary } from '@/hooks/useFinancialData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface CardDetailViewProps {
  card: CardSummary;
  onBack: () => void;
  onGenerateReport: (cardName: string) => string;
}

export const CardDetailView: React.FC<CardDetailViewProps> = ({ card, onBack, onGenerateReport }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [dueDate, setDueDate] = useState(card.due_date?.toString() || '');
  const [closingDate, setClosingDate] = useState(card.closing_date?.toString() || '');

  const formatCurrency = (value: number) => 
    `R$ ${value.toFixed(2).replace('.', ',')}`;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMM", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const handleSave = () => {
    // In a real implementation, this would save to the database
    setIsEditing(false);
    toast({
      title: "Configurações salvas",
      description: "As datas do cartão foram atualizadas.",
    });
  };

  const handleCopyReport = () => {
    const report = onGenerateReport(card.name);
    navigator.clipboard.writeText(report);
    toast({
      title: "Relatório copiado",
      description: "O relatório foi copiado para a área de transferência.",
    });
  };

  const handleShareWhatsApp = () => {
    const report = onGenerateReport(card.name);
    const encodedReport = encodeURIComponent(report);
    const whatsappUrl = `https://wa.me/?text=${encodedReport}`;
    window.open(whatsappUrl, '_blank');
  };

  const nextDueDate = dueDate ? new Date(new Date().getFullYear(), new Date().getMonth(), parseInt(dueDate)) : null;
  const nextClosingDate = closingDate ? new Date(new Date().getFullYear(), new Date().getMonth(), parseInt(closingDate)) : null;

  // Adjust dates if they've already passed this month
  if (nextDueDate && nextDueDate < new Date()) {
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
  }
  if (nextClosingDate && nextClosingDate < new Date()) {
    nextClosingDate.setMonth(nextClosingDate.getMonth() + 1);
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
            <h2 className="text-2xl font-bold">{card.name}</h2>
            <p className="text-muted-foreground">
              {card.type === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'} • {' '}
              {card.transactions.length} transação{card.transactions.length !== 1 ? 'ões' : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(card.total)}
          </div>
          <div className="text-sm text-muted-foreground">
            {card.percentage.toFixed(1)}% do total mensal
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Cartão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Valor Total</div>
                  <div className="text-2xl font-bold">{formatCurrency(card.total)}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Média por Transação</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(card.total / card.transactions.length)}
                  </div>
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
                {card.transactions.map((transaction) => (
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
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {transaction.category}
                        </div>
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

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Configurações do Cartão</CardTitle>
              {!isEditing ? (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="due-date">Dia do Vencimento</Label>
                {isEditing ? (
                  <Input
                    id="due-date"
                    type="number"
                    min="1"
                    max="31"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="Dia do mês"
                  />
                ) : (
                  <div className="p-2 border rounded">
                    {dueDate ? `Todo dia ${dueDate}` : 'Não configurado'}
                  </div>
                )}
                {nextDueDate && !isEditing && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Próximo vencimento: {format(nextDueDate, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="closing-date">Dia do Fechamento</Label>
                {isEditing ? (
                  <Input
                    id="closing-date"
                    type="number"
                    min="1"
                    max="31"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    placeholder="Dia do mês"
                  />
                ) : (
                  <div className="p-2 border rounded">
                    {closingDate ? `Todo dia ${closingDate}` : 'Não configurado'}
                  </div>
                )}
                {nextClosingDate && !isEditing && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Próximo fechamento: {format(nextClosingDate, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relatórios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleCopyReport}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Relatório
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleShareWhatsApp}
              >
                <Share className="w-4 h-4 mr-2" />
                Enviar para WhatsApp
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};