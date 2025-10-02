import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCardBillPayments, CardBillPayment } from '@/hooks/useCardBillPayments';
import { AlertCircle, CheckCircle2, Clock, CreditCard, Calendar, RefreshCw } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BillsDashboardProps {
  groupId: string;
}

export const BillsDashboard = ({ groupId }: BillsDashboardProps) => {
  const {
    billPayments,
    loading,
    markBillAsPaid,
    markBillAsUnpaid,
    getPendingBills,
    getOverdueBills,
    getUpcomingBills,
    getBillsStats,
    generateUpcomingBills
  } = useCardBillPayments(groupId);

  const [activeTab, setActiveTab] = useState('all');
  const [isInitializing, setIsInitializing] = useState(true);
  const stats = getBillsStats();

  // Auto-generate bills on first load if none exist
  useEffect(() => {
    const initializeBills = async () => {
      if (billPayments.length === 0 && !loading) {
        console.log('No bills found, generating automatically...');
        await generateUpcomingBills();
      }
      setIsInitializing(false);
    };

    if (!loading) {
      initializeBills();
    }
  }, [loading]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getBillStatus = (bill: CardBillPayment): { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline'; days: number } => {
    if (bill.is_paid) {
      return { label: 'Paga', variant: 'default', days: 0 };
    }

    if (!bill.due_date) {
      return { label: 'Pendente', variant: 'secondary', days: 0 };
    }

    const today = new Date();
    const dueDate = new Date(bill.due_date);
    const daysUntilDue = differenceInDays(dueDate, today);

    if (daysUntilDue < 0) {
      return { label: `Atrasada (${Math.abs(daysUntilDue)} dias)`, variant: 'destructive', days: daysUntilDue };
    } else if (daysUntilDue <= 7) {
      return { label: `Vence em ${daysUntilDue} dias`, variant: 'outline', days: daysUntilDue };
    } else {
      return { label: 'Em dia', variant: 'secondary', days: daysUntilDue };
    }
  };

  const getFilteredBills = () => {
    switch (activeTab) {
      case 'overdue':
        return getOverdueBills();
      case 'upcoming':
        return getUpcomingBills(7);
      case 'paid':
        return billPayments.filter(b => b.is_paid);
      case 'pending':
        return getPendingBills();
      default:
        return billPayments;
    }
  };

  const sortedBills = getFilteredBills().sort((a, b) => {
    const statusA = getBillStatus(a);
    const statusB = getBillStatus(b);
    
    if (a.is_paid !== b.is_paid) return a.is_paid ? 1 : -1;
    if (!a.due_date && b.due_date) return 1;
    if (a.due_date && !b.due_date) return -1;
    
    return statusA.days - statusB.days;
  });

  if (loading || isInitializing) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas Atrasadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(stats.totalOverdue)}</div>
            <p className="text-xs text-muted-foreground">{stats.countOverdue} fatura{stats.countOverdue !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo em 7 dias</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(stats.totalUpcoming)}</div>
            <p className="text-xs text-muted-foreground">{stats.countUpcoming} fatura{stats.countUpcoming !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas Pendentes</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPending)}</div>
            <p className="text-xs text-muted-foreground">{stats.countPending} fatura{stats.countPending !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas Pagas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(stats.totalPaid)}</div>
            <p className="text-xs text-muted-foreground">Neste mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={generateUpcomingBills} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Gerar Faturas Futuras
        </Button>
      </div>

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle>Controle de Faturas</CardTitle>
          <CardDescription>Gerencie todas as suas faturas de cartão de crédito</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="overdue">
                Atrasadas {stats.countOverdue > 0 && `(${stats.countOverdue})`}
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Próximas {stats.countUpcoming > 0 && `(${stats.countUpcoming})`}
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pendentes {stats.countPending > 0 && `(${stats.countPending})`}
              </TabsTrigger>
              <TabsTrigger value="paid">Pagas</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-4">
              {sortedBills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>Nenhuma fatura encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedBills.map((bill) => {
                    const status = getBillStatus(bill);
                    return (
                      <Card key={bill.id} className={status.variant === 'destructive' ? 'border-destructive/50 bg-destructive/5' : ''}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{bill.card_name}</h4>
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(bill.year, bill.month - 1), 'MMMM yyyy', { locale: ptBR })}
                                {bill.due_date && (
                                  <> • Vencimento: {format(new Date(bill.due_date), 'dd/MM/yyyy', { locale: ptBR })}</>
                                )}
                              </p>
                              {bill.notes && (
                                <p className="text-sm text-muted-foreground italic">{bill.notes}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-2xl font-bold">{formatCurrency(Number(bill.amount))}</p>
                              </div>

                              {bill.is_paid ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => markBillAsUnpaid(bill.card_name, bill.month, bill.year)}
                                >
                                  Desmarcar
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => markBillAsPaid(bill.card_name, bill.month, bill.year, Number(bill.amount))}
                                >
                                  Marcar como Paga
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
