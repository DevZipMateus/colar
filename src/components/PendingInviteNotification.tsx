
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, X, RefreshCw, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useInviteHandler, InviteError } from '@/hooks/useInviteHandler';

const PendingInviteNotification = () => {
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  
  const { joinGroup } = useGroups();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    retryPendingInvite, 
    clearPendingInvite, 
    processing, 
    lastError, 
    processInvite 
  } = useInviteHandler();

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

  const handleProcessInvite = async (code?: string) => {
    const inviteCode = code || pendingInvite;
    if (!inviteCode || !user) return;

    const result = await processInvite(inviteCode);
    
    if (result.success) {
      setPendingInvite(null);
      setShowManualEntry(false);
      setManualCode('');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleProcessInvite(manualCode.trim().toLowerCase());
    }
  };

  const handleRetry = async () => {
    const result = await retryPendingInvite();
    if (result.success) {
      setPendingInvite(null);
      setShowManualEntry(false);
    }
  };

  const dismissInvite = () => {
    clearPendingInvite();
    setPendingInvite(null);
    setShowManualEntry(false);
  };

  const getErrorIcon = (error: InviteError) => {
    switch (error.type) {
      case 'email_not_confirmed':
        return <Mail className="text-yellow-600" size={16} />;
      case 'already_member':
        return <CheckCircle className="text-green-600" size={16} />;
      case 'invalid_code':
        return <AlertCircle className="text-red-600" size={16} />;
      default:
        return <AlertCircle className="text-red-600" size={16} />;
    }
  };

  const getErrorColor = (error: InviteError) => {
    switch (error.type) {
      case 'email_not_confirmed':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'already_member':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'network_error':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
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

          {/* Error Display */}
          {lastError && (
            <div className={`mb-3 p-2 rounded-lg border text-xs ${getErrorColor(lastError)}`}>
              <div className="flex items-center space-x-2">
                {getErrorIcon(lastError)}
                <span className="font-medium">{lastError.message}</span>
              </div>
              {lastError.actionText && (
                <div className="mt-1 text-xs opacity-80">
                  {lastError.actionText}
                </div>
              )}
            </div>
          )}

          {pendingInvite && !showManualEntry ? (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Você tem um convite para participar de um grupo.
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleProcessInvite()}
                  disabled={processing}
                  className="flex-1 bg-colar-orange hover:bg-colar-orange-dark text-white"
                  size="sm"
                >
                  {processing ? (
                    <>
                      <RefreshCw size={14} className="mr-1 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar no Grupo'
                  )}
                </Button>
                
                {lastError?.canRetry && (
                  <Button
                    onClick={handleRetry}
                    disabled={processing}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw size={14} className={processing ? 'animate-spin' : ''} />
                  </Button>
                )}
                
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
                    disabled={processing || !manualCode.trim()}
                    className="flex-1 bg-colar-orange hover:bg-colar-orange-dark text-white"
                    size="sm"
                  >
                    {processing ? (
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

          {/* Help Text */}
          <div className="mt-3 text-xs text-gray-500">
            <p className="mb-1">💡 <strong>Dicas:</strong></p>
            <ul className="space-y-1 text-xs">
              <li>• Confirme seu email se ainda não confirmou</li>
              <li>• Use a mesma conta que recebeu o convite</li>
              <li>• Códigos são válidos por tempo limitado</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingInviteNotification;
