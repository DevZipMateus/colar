
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, X, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useInviteHandler } from '@/hooks/useInviteHandler';
import DebugInfoPanel from '@/components/invite/DebugInfoPanel';
import ErrorDisplay from '@/components/invite/ErrorDisplay';
import InviteActions from '@/components/invite/InviteActions';
import ManualInviteForm from '@/components/invite/ManualInviteForm';
import HelpText from '@/components/invite/HelpText';

const PendingInviteNotification = () => {
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
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
      const urlParams = new URLSearchParams(window.location.search);
      const inviteFromUrl = urlParams.get('invite');
      
      const currentInvite = inviteFromUrl || stored;
      
      console.log('🔍 Checking pending invite:', {
        stored,
        fromUrl: inviteFromUrl,
        current: currentInvite,
        userReady: !!user,
        emailConfirmed: !!user?.email_confirmed_at
      });
      
      setPendingInvite(currentInvite);
    };

    checkPendingInvite();
    
    // Check less frequently to avoid performance issues
    const interval = setInterval(checkPendingInvite, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleProcessInvite = async (code?: string) => {
    const inviteCode = code || pendingInvite;
    if (!inviteCode || !user) {
      console.log('❌ Cannot process invite:', { inviteCode, hasUser: !!user });
      return;
    }

    console.log('🎯 Processing invite from notification:', inviteCode);
    const result = await processInvite(inviteCode);
    
    if (result.success) {
      console.log('✅ Invite processed successfully, clearing state');
      setPendingInvite(null);
      setShowManualEntry(false);
      setManualCode('');
      localStorage.removeItem('pending_invite');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      console.log('📝 Manual invite code submitted:', manualCode.trim());
      handleProcessInvite(manualCode.trim().toLowerCase());
    }
  };

  const handleRetry = async () => {
    console.log('🔄 Retry button clicked');
    const result = await retryPendingInvite();
    if (result.success) {
      setPendingInvite(null);
      setShowManualEntry(false);
    }
  };

  const dismissInvite = () => {
    console.log('❌ Dismissing invite notification');
    clearPendingInvite();
    setPendingInvite(null);
    setShowManualEntry(false);
    
    // Also clear URL parameter if present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('invite')) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('invite');
      window.history.replaceState({}, '', newUrl.toString());
    }
  };

  // Don't show if no user or no invite
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
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="h-6 w-6 p-0 hover:bg-blue-100"
                title="Informações de debug"
              >
                <Info size={12} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissInvite}
                className="h-6 w-6 p-0 hover:bg-red-100"
              >
                <X size={14} />
              </Button>
            </div>
          </div>

          {/* Debug Information */}
          {showDebugInfo && user && (
            <DebugInfoPanel 
              user={user} 
              pendingInvite={pendingInvite} 
              processing={processing} 
            />
          )}

          {/* Error Display */}
          {lastError && <ErrorDisplay error={lastError} />}

          {pendingInvite && !showManualEntry ? (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Você tem um convite para participar de um grupo.
              </p>
              <InviteActions
                processing={processing}
                lastError={lastError}
                onProcessInvite={() => handleProcessInvite()}
                onRetry={handleRetry}
                onShowManualEntry={() => setShowManualEntry(true)}
              />
            </>
          ) : (
            <ManualInviteForm
              manualCode={manualCode}
              processing={processing}
              pendingInvite={pendingInvite}
              onCodeChange={setManualCode}
              onSubmit={handleManualSubmit}
              onBack={pendingInvite ? () => setShowManualEntry(false) : undefined}
            />
          )}

          <HelpText />
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingInviteNotification;
