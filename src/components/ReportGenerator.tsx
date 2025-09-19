import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Share, FileText, Download } from 'lucide-react';
import { FinancialSummary } from '@/hooks/useFinancialData';
import { toast } from '@/hooks/use-toast';

interface ReportGeneratorProps {
  summary: FinancialSummary;
  onGenerateReport: (type: 'full' | 'card', cardName?: string) => string;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ summary, onGenerateReport }) => {
  const handleCopyFullReport = () => {
    const report = onGenerateReport('full');
    navigator.clipboard.writeText(report);
    toast({
      title: "Relatório copiado",
      description: "O relatório completo foi copiado para a área de transferência.",
    });
  };

  const handleShareWhatsApp = () => {
    const report = onGenerateReport('full');
    const encodedReport = encodeURIComponent(report);
    const whatsappUrl = `https://wa.me/?text=${encodedReport}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDownloadReport = () => {
    const report = onGenerateReport('full');
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Relatório baixado",
      description: "O arquivo foi salvo no seu dispositivo.",
    });
  };

  const handleCopyCardReport = (cardName: string) => {
    const report = onGenerateReport('card', cardName);
    navigator.clipboard.writeText(report);
    toast({
      title: "Relatório do cartão copiado",
      description: `O relatório do ${cardName} foi copiado para a área de transferência.`,
    });
  };

  const handleShareCardWhatsApp = (cardName: string) => {
    const report = onGenerateReport('card', cardName);
    const encodedReport = encodeURIComponent(report);
    const whatsappUrl = `https://wa.me/?text=${encodedReport}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Relatório Completo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Gere um relatório completo com todos os gastos, categorias e cartões do mês.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCopyFullReport}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleShareWhatsApp}
            >
              <Share className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownloadReport}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios por Cartão</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Gere relatórios específicos para cada cartão.
          </p>
          
          <div className="space-y-3">
            {summary.cards.map((card) => (
              <div key={card.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{card.name}</div>
                  <div className="text-sm text-muted-foreground">
                    R$ {card.total.toFixed(2).replace('.', ',')} • {card.transactions.length} transações
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCardReport(card.name)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareCardWhatsApp(card.name)}
                  >
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Total de Gastos</div>
              <div className="text-2xl font-bold text-red-600">
                R$ {summary.totalExpenses.toFixed(2).replace('.', ',')}
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Categoria Principal</div>
              <div className="text-lg font-bold">
                {summary.topCategories[0]?.name || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">
                {summary.topCategories[0] && 
                  `R$ ${summary.topCategories[0].total.toFixed(2).replace('.', ',')} (${summary.topCategories[0].percentage.toFixed(1)}%)`
                }
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Cartão Principal</div>
              <div className="text-lg font-bold">
                {summary.topCard?.name || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">
                {summary.topCard && 
                  `R$ ${summary.topCard.total.toFixed(2).replace('.', ',')} (${summary.topCard.percentage.toFixed(1)}%)`
                }
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Transações</div>
              <div className="text-2xl font-bold">
                {summary.categories.reduce((total, cat) => total + cat.transactions.length, 0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};