import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, CheckCircle, AlertCircle, Brain, FileText, TrendingUp, Search } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CSVImportProps {
  groupId: string;
  onSuccess: () => void;
}

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

interface FinancialOverview {
  totais: {
    total_gastos: number | null;
    saldo: number | null;
    total_fixos: number | null;
    total_gastos_mes: number | null;
  };
  categorias: Array<{
    nome: string;
    valor_esperado: number | null;
    valor_gasto: number | null;
    porcentagem: number | null;
  }>;
  analises: {
    saldo_status: 'positivo' | 'negativo' | 'neutro';
    categorias_estouradas: string[];
    maior_gasto: string;
    percentual_usado_orcamento: number | null;
  };
}

export const CSVImport: React.FC<CSVImportProps> = ({ groupId, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<ParsedTransaction[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [csvContent, setCsvContent] = useState<string>('');
  const [financialOverview, setFinancialOverview] = useState<FinancialOverview | null>(null);
  const { addTransaction } = useFinancialData(groupId);

  const parseCSVContent = (content: string): ParsedTransaction[] => {
    const lines = content.split('\n');
    const transactions: ParsedTransaction[] = [];
    let currentSection = '';
    let currentCardName = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Check if this is a section header (e.g., "FIXOS", "Cartão Nubank")
      if (line.includes('FIXOS') || line.includes('Cartão') || line.includes('Card') || 
          (!line.includes(',') && !line.includes('Nome'))) {
        currentSection = line;
        if (line.includes('Cartão') || line.includes('Card')) {
          currentCardName = line.replace('Cartão', '').replace('Card', '').trim();
        } else if (line.includes('FIXOS')) {
          currentCardName = 'FIXOS';
        }
        continue;
      }

      // Skip header lines
      if (line.includes('Nome,') || line.includes('Descrição,')) continue;

      // Parse transaction line
      const columns = parseCSVLine(line);
      if (columns.length < 5) continue;

      const [nome, parcela, data, categoria, valor, tipo] = columns;
      
      if (!nome.trim() || !valor.trim()) continue;

      const amount = parseAmount(valor);
      if (amount <= 0) continue;

      // Determine card name and type
      let cardName = currentCardName || tipo?.trim() || 'Outros';
      let cardType: 'credit' | 'debit' = 'credit';

      // Map specific card names from the CSV format
      if (currentSection.includes('FIXOS') || tipo?.toLowerCase().includes('débito')) {
        cardType = 'debit';
        if (tipo?.toLowerCase().includes('débito')) {
          cardName = 'Débito';
        }
      } else if (currentSection.includes('Nubank')) {
        cardName = 'Nubank';
      } else if (currentSection.includes('Magalu') || currentSection.includes('Magazine')) {
        cardName = 'Magalu';
      }

      const installmentInfo = parseInstallments(parcela);
      
      transactions.push({
        description: nome.trim(),
        amount,
        date: parseDate(data),
        category: categoria?.trim() || 'Outros',
        card_name: cardName,
        card_type: cardType,
        ...installmentInfo
      });
    }

    return transactions;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const parseAmount = (amountStr: string): number => {
    // Remove "R$", spaces, and convert comma to dot
    const cleanAmount = amountStr
      .replace(/R\$/g, '')
      .replace(/\s/g, '')
      .replace(/"/g, '')
      .replace(',', '.');
    
    return parseFloat(cleanAmount) || 0;
  };

  const inferCardType = (cardName: string, type: string): 'credit' | 'debit' => {
    if (type && type.toLowerCase().includes('débito')) return 'debit';
    if (type && type.toLowerCase().includes('crédito')) return 'credit';
    if (cardName.toLowerCase().includes('débito')) return 'debit';
    return 'credit'; // Default to credit
  };

  const parseDate = (dateStr: string): string => {
    if (!dateStr || dateStr.trim() === '') {
      return new Date().toISOString().split('T')[0];
    }

    // Try to parse DD/MM format
    const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1; // JS months are 0-indexed
      const year = new Date().getFullYear();
      return new Date(year, month, day).toISOString().split('T')[0];
    }

    return new Date().toISOString().split('T')[0];
  };

  const parseInstallments = (parcelaStr: string): { installments?: number, installment_number?: number } => {
    if (!parcelaStr || parcelaStr.trim() === '') return {};
    
    const match = parcelaStr.match(/(\d+)\/(\d+)/);
    if (match) {
      return {
        installment_number: parseInt(match[1]),
        installments: parseInt(match[2])
      };
    }
    
    return {};
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      previewCSV(selectedFile);
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo CSV válido.",
        variant: "destructive",
      });
    }
  };

  const previewCSV = async (file: File) => {
    const text = await file.text();
    setCsvContent(text);
    const allTransactions = parseCSVContent(text);
    
    // Preview first 10 transactions
    setPreview(allTransactions.slice(0, 10));
  };

  const analyzeWithAI = async (analysisType: string) => {
    if (!csvContent) {
      toast({
        title: "Erro",
        description: "Nenhum arquivo CSV carregado para análise.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-csv', {
        body: { 
          csvContent: csvContent.slice(0, 5000), // Limit to first 5000 chars for analysis
          analysisType 
        }
      });

      if (error) throw error;

      if (data.success) {
        if (analysisType === 'financial-overview') {
          try {
            const overview = JSON.parse(data.analysis);
            setFinancialOverview(overview);
          } catch (parseError) {
            console.error('Error parsing financial overview:', parseError);
            // Fallback to regular analysis display
            setAiAnalysis({
              ...data,
              type: analysisType
            });
          }
        } else {
          setAiAnalysis({
            ...data,
            type: analysisType
          });
        }
        toast({
          title: "Análise Concluída",
          description: "A IA analisou seu CSV com sucesso!",
        });
      } else {
        throw new Error(data.error || 'Erro na análise');
      }
    } catch (error) {
      console.error('Error analyzing CSV:', error);
      toast({
        title: "Erro na Análise",
        description: "Não foi possível analisar o CSV com IA.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);

    try {
      const text = await file.text();
      const transactions = parseCSVContent(text);

      // Import transactions
      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        await addTransaction({
          group_id: groupId,
          ...transaction
        });
        
        setProgress(((i + 1) / transactions.length) * 100);
      }

      toast({
        title: "Importação concluída",
        description: `${transactions.length} transações foram importadas com sucesso.`,
      });

      onSuccess();
      setFile(null);
      setPreview([]);
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar o arquivo CSV.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Importar Dados CSV
          </CardTitle>
          <CardDescription>
            Faça upload do arquivo CSV com suas transações financeiras
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csv-file">Selecionar arquivo CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importing}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Formato esperado: Nome, Parcela, Data, Categoria, Valor, Tipo
            </p>
          </div>

          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Importando...</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {file && !importing && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <Button onClick={handleImport} size="sm">
                Importar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis Section */}
      {file && csvContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Análise Inteligente do CSV
            </CardTitle>
            <CardDescription>
              Use IA para analisar e validar seu arquivo antes da importação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="financial" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="financial" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Análise Financeira
                </TabsTrigger>
                <TabsTrigger value="structure" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Estrutura
                </TabsTrigger>
                <TabsTrigger value="validation" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Validação
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="financial" className="space-y-4">
                <Button 
                  onClick={() => analyzeWithAI('financial-overview')} 
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? 'Analisando Dados Financeiros...' : 'Analisar Dados Financeiros'}
                </Button>
              </TabsContent>

              <TabsContent value="structure" className="space-y-4">
                <Button 
                  onClick={() => analyzeWithAI('structure')} 
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? 'Analisando Estrutura...' : 'Analisar Estrutura do CSV'}
                </Button>
              </TabsContent>

              <TabsContent value="validation" className="space-y-4">
                <Button 
                  onClick={() => analyzeWithAI('validation')} 
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? 'Validando Dados...' : 'Validar Dados do CSV'}
                </Button>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <Button 
                  onClick={() => analyzeWithAI('insights')} 
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? 'Gerando Insights...' : 'Gerar Insights Financeiros'}
                </Button>
              </TabsContent>
            </Tabs>

            {/* Financial Overview Results */}
            {financialOverview && (
              <div className="mt-4 space-y-4">
                {/* Totais Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Resumo Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {financialOverview.totais.total_gastos !== null && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Total de Gastos</p>
                          <p className="text-2xl font-bold">R$ {financialOverview.totais.total_gastos.toFixed(2)}</p>
                        </div>
                      )}
                      {financialOverview.totais.saldo !== null && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Saldo</p>
                          <p className={`text-2xl font-bold ${financialOverview.totais.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {financialOverview.totais.saldo.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {financialOverview.totais.total_fixos !== null && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Gastos Fixos</p>
                          <p className="text-2xl font-bold">R$ {financialOverview.totais.total_fixos.toFixed(2)}</p>
                        </div>
                      )}
                      {financialOverview.totais.total_gastos_mes !== null && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Gastos do Mês</p>
                          <p className="text-2xl font-bold">R$ {financialOverview.totais.total_gastos_mes.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Categorias Card */}
                {financialOverview.categorias.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Análise por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {financialOverview.categorias.map((categoria, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium">{categoria.nome}</h4>
                              <div className="text-sm text-muted-foreground">
                                {categoria.valor_esperado !== null && categoria.valor_gasto !== null && (
                                  <>Orçado: R$ {categoria.valor_esperado.toFixed(2)} • Gasto: R$ {categoria.valor_gasto.toFixed(2)}</>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {categoria.porcentagem !== null && (
                                <Badge variant={categoria.porcentagem > 100 ? "destructive" : "secondary"}>
                                  {categoria.porcentagem.toFixed(0)}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Análises Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Alertas e Análises
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={financialOverview.analises.saldo_status === 'positivo' ? 'default' : 'destructive'}>
                        Saldo {financialOverview.analises.saldo_status}
                      </Badge>
                    </div>
                    
                    {financialOverview.analises.categorias_estouradas.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-600 mb-2">Categorias que estouraram o orçamento:</p>
                        <div className="flex flex-wrap gap-2">
                          {financialOverview.analises.categorias_estouradas.map((categoria, index) => (
                            <Badge key={index} variant="destructive">{categoria}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {financialOverview.analises.maior_gasto && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Maior categoria de gasto: <span className="font-medium">{financialOverview.analises.maior_gasto}</span>
                        </p>
                      </div>
                    )}
                    
                    {financialOverview.analises.percentual_usado_orcamento !== null && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Percentual do orçamento utilizado: <span className="font-medium">{financialOverview.analises.percentual_usado_orcamento.toFixed(0)}%</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Analysis Results */}
            {aiAnalysis && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Análise da IA
                    <Badge variant="outline">{aiAnalysis.type}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
                    {aiAnalysis.analysis}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prévia dos Dados</CardTitle>
            <p className="text-sm text-muted-foreground">
              Primeiras {preview.length} transações encontradas
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {preview.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.category} • {transaction.card_name} • {transaction.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">R$ {transaction.amount.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.card_type === 'credit' ? 'Crédito' : 'Débito'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Modelo CSV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Baixe um modelo de arquivo CSV para facilitar a importação dos seus dados.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              const csvContent = `FIXOS
Nome,Parcela,Data,Categoria,Valor,Tipo
Crunchyroll(Dividido),,Crédito,Assinaturas,"R$ 20,00",Crédito
Internet nio,,Débito,Assinaturas,"R$ 75,00",Débito

Cartão Nubank
Nome,Parcela,Data,Categoria,Valor,Tipo
Aspirador de pó Carrefour,3/15,19/07,Necessidades,"R$ 16,00",
Studio Asaphoto,2/12,13/07,Presentes,"R$ 73,32",

Cartão Magalu
Nome,Parcela,Data,Categoria,Valor,Tipo
Carrefour (multiprocessador),3/5,11/07,Eletrônicos,"R$ 26,71",
Bolsa Maternidade,2/4,17/08,Necessidades,"R$ 47,49",`;
              
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'modelo-financeiro.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Modelo CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};