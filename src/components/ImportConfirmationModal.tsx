import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CreditCard, TrendingUp, TrendingDown } from "lucide-react";

interface ImportConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ImportConfirmationModal({
  open,
  onOpenChange,
  data,
  onConfirm,
  onCancel
}: ImportConfirmationModalProps) {
  const [importing, setImporting] = useState(false);

  if (!data) return null;

  const handleConfirm = async () => {
    setImporting(true);
    await onConfirm();
    setImporting(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirmar Importação de Dados Financeiros
          </DialogTitle>
          <DialogDescription>
            Revise os dados extraídos do CSV antes de importar. Verifique se as informações estão corretas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total de Gastos</p>
                  <p className="text-lg font-semibold text-red-600">
                    {data.totais?.total_gastos ? formatCurrency(data.totais.total_gastos) : 'N/A'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={`text-lg font-semibold ${data.totais?.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.totais?.saldo !== null ? formatCurrency(data.totais.saldo) : 'N/A'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Gastos Fixos</p>
                  <p className="text-lg font-semibold">
                    {data.totais?.total_fixos ? formatCurrency(data.totais.total_fixos) : 'N/A'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Cartão</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {data.totais?.total_cartao ? formatCurrency(data.totais.total_cartao) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cartões de Crédito */}
          {data.cartoes && data.cartoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Cartões de Crédito ({data.cartoes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {data.cartoes.map((cartao: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{cartao.nome}</h4>
                        <Badge variant="outline" className="text-blue-600 font-semibold">
                          {formatCurrency(cartao.total)}
                        </Badge>
                      </div>
                      {cartao.transacoes && cartao.transacoes.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {cartao.transacoes.length} transações encontradas
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categorias */}
          {data.categorias && data.categorias.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Categorias Identificadas ({data.categorias.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {data.categorias.map((categoria: any, index: number) => (
                    <Badge key={index} variant="secondary" className="justify-center">
                      {categoria.nome}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alertas */}
          {data.analises?.alertas && data.analises.alertas.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-amber-800">
                  {data.analises.alertas.map((alerta: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      {alerta}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Status do Saldo */}
          {data.analises?.saldo_status && (
            <Card className={`border ${
              data.analises.saldo_status === 'positivo' ? 'border-green-200 bg-green-50' :
              data.analises.saldo_status === 'negativo' ? 'border-red-200 bg-red-50' :
              'border-gray-200 bg-gray-50'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {data.analises.saldo_status === 'positivo' ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : data.analises.saldo_status === 'negativo' ? (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  ) : null}
                  <span className={`font-medium ${
                    data.analises.saldo_status === 'positivo' ? 'text-green-800' :
                    data.analises.saldo_status === 'negativo' ? 'text-red-800' :
                    'text-gray-800'
                  }`}>
                    Saldo {data.analises.saldo_status.charAt(0).toUpperCase() + data.analises.saldo_status.slice(1)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { onCancel(); onOpenChange(false); }}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={importing}>
            {importing ? "Importando..." : "Confirmar Importação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}