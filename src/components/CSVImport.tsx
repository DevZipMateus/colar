import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { toast } from '@/hooks/use-toast';

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

export const CSVImport: React.FC<CSVImportProps> = ({ groupId, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<ParsedTransaction[]>([]);
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
    const allTransactions = parseCSVContent(text);
    
    // Preview first 10 transactions
    setPreview(allTransactions.slice(0, 10));
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