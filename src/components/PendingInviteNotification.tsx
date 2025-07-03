
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, X, RefreshCw } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const PendingInviteNotification = () => {
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const { joinGroup } = useGroups();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const checkPendingInvite = () => {
      const stored = localStorage.getItem('pending_invite');
      setPendingInvite(stored);
    };

    checkPendingInvite();
    
    // Check periodically in case it changes
    const interval = setInterval(checkPendingInvite, 1000);
    return () => clearInterval(interval);
  }, []);

  const processPendingInvite = async (code?: string) => {
    const inviteCode = code || pendingInvite;
    if (!inviteCode || !user) return;

    setIsProcessing(true);
    console.log('Processing invite code:', inviteCode);

    try {
      const result = await joinGroup(inviteCode);
      
      if (result.error) {
        toast({
          title: "Erro ao entrar no grupo",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bem-vindo ao grupo!",
          description: `Você foi adicionado ao grupo "${result.data?.name}" com sucesso.`,
        });
        localStorage.removeItem('pending_invite');
        setPendingInvite(null);
        setShowManualEntry(false);
        setManualCode('');
      }
    } catch (error) {
      console.error('Error processing invite:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processPendingInvite(manualCode.trim().toLowerCase());
    }
  };

  const dismissInvite = () => {
    localStorage.removeItem('pending_invite');
    setPendingInvite(null);
    setShowManualEntry(false);
  };

  if (!user || (!pendingInvite && !showManualEntry)) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-right">
      <Card className="border-colar-orange bg-gradient-to-r from-colar-orange/5 to-colar-orange/10">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <UserPlus className="text-colar-orange" size={20} />
              <h3 className="font-semibold text-colar-navy">
                {pendingInvite ? 'Convite Pendente' : 'Entrar em Grupo'}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissInvite}
              className="h-6 w-6 p-0 hover:bg-red-100"
            >
              <X size={14} />
            </Button>
          </div>

          {pendingInvite && !showManualEntry ? (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Você tem um convite para participar de um grupo.
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={() => processPendingInvite()}
                  disabled={isProcessing}
                  className="flex-1 bg-colar-orange hover:bg-colar-orange-dark text-white"
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={14} className="mr-1 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar no Grupo'
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualEntry(true)}
                >
                  Manual
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Digite o código do grupo para participar:
              </p>
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Código de convite"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-orange focus:border-transparent"
                />
                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={isProcessing || !manualCode.trim()}
                    className="flex-1 bg-colar-orange hover:bg-colar-orange-dark text-white"
                    size="sm"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={14} className="mr-1 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                  {pendingInvite && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowManualEntry(false)}
                    >
                      Voltar
                    </Button>
                  )}
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingInviteNotification;
