import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Share2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  installments?: number | null;
  installment_number?: number | null;
  card_name: string;
}

interface Installment {
  id: string;
  transaction_id: string;
  installment_number: number;
  total_installments: number;
  amount: number;
  due_month: number;
  due_year: number;
  is_paid: boolean;
  paid_at?: string | null;
}

interface CategoryInstallmentReportProps {
  categoryName: string;
  transactions: Transaction[];
  installments: Installment[];
  onBack: () => void;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const CategoryInstallmentReport = ({
  categoryName,
  transactions,
  installments,
  onBack
}: CategoryInstallmentReportProps) => {
  const { toast } = useToast();

  // Calcular totais
  const totalInstallments = installments.length;
  const totalAmount = installments.reduce((sum, inst) => sum + Number(inst.amount), 0);
  const paidInstallments = installments.filter(inst => inst.is_paid).length;
  const paidAmount = installments
    .filter(inst => inst.is_paid)
    .reduce((sum, inst) => sum + Number(inst.amount), 0);
  const remainingAmount = totalAmount - paidAmount;

  // Agrupar parcelas por transação
  const transactionMap = new Map<string, {
    transaction: Transaction;
    installments: Installment[];
  }>();

  transactions.forEach(transaction => {
    const transactionInstallments = installments.filter(
      inst => inst.transaction_id === transaction.id
    );
    if (transactionInstallments.length > 0) {
      transactionMap.set(transaction.id, {
        transaction,
        installments: transactionInstallments
      });
    }
  });

  const generateReportText = () => {
    let report = `📊 RELATÓRIO DE PARCELAS - ${categoryName.toUpperCase()}\n`;
    report += `${"=".repeat(60)}\n\n`;
    report += `💰 RESUMO GERAL\n`;
    report += `   Total de Parcelas: ${totalInstallments}\n`;
    report += `   Valor Total: ${formatCurrency(totalAmount)}\n`;
    report += `   Parcelas Pagas: ${paidInstallments} (${formatCurrency(paidAmount)})\n`;
    report += `   Valor Restante: ${formatCurrency(remainingAmount)}\n\n`;
    report += `${"-".repeat(60)}\n\n`;

    transactionMap.forEach(({ transaction, installments: txInstallments }) => {
      report += `📝 ${transaction.description}\n`;
      report += `   Cartão: ${transaction.card_name}\n`;
      report += `   Data: ${format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}\n`;
      report += `   Parcelas: ${txInstallments.length}x de ${formatCurrency(txInstallments[0]?.amount || 0)}\n`;
      report += `   Valor Total: ${formatCurrency(txInstallments.reduce((sum, i) => sum + Number(i.amount), 0))}\n\n`;

      txInstallments.forEach(inst => {
        const status = inst.is_paid ? "✅ Paga" : "⏳ Pendente";
        const dueDate = `${String(inst.due_month).padStart(2, '0')}/${inst.due_year}`;
        report += `      ${inst.installment_number}/${inst.total_installments} - ${dueDate} - ${formatCurrency(inst.amount)} - ${status}\n`;
      });
      report += `\n`;
    });

    report += `${"-".repeat(60)}\n`;
    report += `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n`;

    return report;
  };

  const handleCopyReport = () => {
    const report = generateReportText();
    navigator.clipboard.writeText(report);
    toast({
      title: "Relatório copiado!",
      description: "O relatório foi copiado para a área de transferência."
    });
  };

  const handleShareWhatsApp = () => {
    const report = generateReportText();
    const encodedReport = encodeURIComponent(report);
    window.open(`https://wa.me/?text=${encodedReport}`, '_blank');
  };

  const handleDownloadReport = () => {
    const report = generateReportText();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-parcelas-${categoryName.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Relatório baixado!",
      description: "O arquivo foi salvo com sucesso."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyReport}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </Button>
          <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
            <Share2 className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatório de Parcelas - {categoryName}</CardTitle>
          <CardDescription>
            Resumo detalhado de todas as parcelas desta categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Parcelas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInstallments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valor Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pagas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(paidAmount)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {paidInstallments} de {totalInstallments}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Restante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(remainingAmount)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detalhamento por Transação</h3>
            {Array.from(transactionMap.values()).map(({ transaction, installments: txInstallments }) => (
              <Card key={transaction.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{transaction.description}</CardTitle>
                      <CardDescription>
                        Cartão: {transaction.card_name} • Data: {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {txInstallments.length}x de {formatCurrency(txInstallments[0]?.amount || 0)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {txInstallments
                      .sort((a, b) => a.installment_number - b.installment_number)
                      .map(inst => (
                        <div
                          key={inst.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant={inst.is_paid ? "default" : "outline"}>
                              {inst.installment_number}/{inst.total_installments}
                            </Badge>
                            <span className="text-sm">
                              {String(inst.due_month).padStart(2, '0')}/{inst.due_year}
                            </span>
                            <span className="font-medium">{formatCurrency(inst.amount)}</span>
                          </div>
                          <Badge variant={inst.is_paid ? "default" : "secondary"}>
                            {inst.is_paid ? "✅ Paga" : "⏳ Pendente"}
                          </Badge>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="font-semibold">Total da transação:</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(txInstallments.reduce((sum, i) => sum + Number(i.amount), 0))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
