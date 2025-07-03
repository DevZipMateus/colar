
import { useEffect, useState } from 'react';
import { useGroups } from './useGroups';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

export interface InviteError {
  type: 'invalid_code' | 'already_member' | 'email_not_confirmed' | 'network_error' | 'unknown';
  message: string;
  canRetry: boolean;
  requiresAction: boolean;
  actionText?: string;
}

export const useInviteHandler = () => {
  const { joinGroup } = useGroups();
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [lastError, setLastError] = useState<InviteError | null>(null);

  const parseError = (errorMessage: string): InviteError => {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('código de convite inválido') || message.includes('invalid')) {
      return {
        type: 'invalid_code',
        message: 'Código de convite inválido ou expirado',
        canRetry: false,
        requiresAction: true,
        actionText: 'Solicite um novo convite'
      };
    }
    
    if (message.includes('já faz parte') || message.includes('already')) {
      return {
        type: 'already_member',
        message: 'Você já faz parte deste grupo',
        canRetry: false,
        requiresAction: false
      };
    }
    
    if (message.includes('email') && message.includes('confirm')) {
      return {
        type: 'email_not_confirmed',
        message: 'Confirme seu email antes de entrar no grupo',
        canRetry: true,
        requiresAction: true,
        actionText: 'Verificar email'
      };
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        type: 'network_error',
        message: 'Erro de conexão. Tente novamente.',
        canRetry: true,
        requiresAction: false
      };
    }
    
    return {
      type: 'unknown',
      message: errorMessage || 'Erro desconhecido',
      canRetry: true,
      requiresAction: false
    };
  };

  const processInvite = async (inviteCode: string, isRetry: boolean = false) => {
    if (!user) {
      console.log('User not authenticated, storing invite for later');
      localStorage.setItem('pending_invite', inviteCode);
      
      toast({
        title: "Convite detectado",
        description: "Faça login ou crie uma conta para participar do grupo.",
      });
      return { success: false, stored: true };
    }

    setProcessing(true);
    setLastError(null);
    
    console.log(`${isRetry ? 'Retrying' : 'Processing'} invite code:`, inviteCode);

    try {
      const result = await joinGroup(inviteCode);
      
      if (result.error) {
        const errorInfo = parseError(result.error);
        setLastError(errorInfo);
        
        console.error('Error joining group:', result.error);
        
        toast({
          title: "Erro ao entrar no grupo",
          description: errorInfo.message,
          variant: "destructive",
        });
        
        return { success: false, error: errorInfo };
      } else {
        console.log('Successfully joined group');
        
        toast({
          title: "Bem-vindo ao grupo!",
          description: `Você foi adicionado ao grupo "${result.data?.name}" com sucesso.`,
        });
        
        // Clear stored invite
        localStorage.removeItem('pending_invite');
        setLastError(null);
        
        return { success: true, data: result.data };
      }
    } catch (error) {
      console.error('Unexpected error processing invite:', error);
      
      const errorInfo: InviteError = {
        type: 'network_error',
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
        canRetry: true,
        requiresAction: false
      };
      
      setLastError(errorInfo);
      
      toast({
        title: "Erro de conexão",
        description: errorInfo.message,
        variant: "destructive",
      });
      
      return { success: false, error: errorInfo };
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const handleInviteFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteCode = urlParams.get('invite');

      if (inviteCode) {
        // Clear URL immediately
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('invite');
        window.history.replaceState({}, '', newUrl.toString());

        await processInvite(inviteCode);
      } else {
        // Check for pending invite
        const pendingInvite = localStorage.getItem('pending_invite');
        if (pendingInvite && user) {
          console.log('Processing pending invite from localStorage:', pendingInvite);
          await processInvite(pendingInvite);
        }
      }
    };

    // Only run when user state is determined
    if (user !== undefined) {
      handleInviteFromUrl();
    }
  }, [user]);

  const retryPendingInvite = async () => {
    const pendingInvite = localStorage.getItem('pending_invite');
    if (pendingInvite && user) {
      console.log('Manually retrying pending invite:', pendingInvite);
      return await processInvite(pendingInvite, true);
    }
    return { success: false, error: { type: 'unknown', message: 'Nenhum convite pendente encontrado' } };
  };

  const clearPendingInvite = () => {
    localStorage.removeItem('pending_invite');
    setLastError(null);
  };

  return { 
    retryPendingInvite, 
    clearPendingInvite,
    processing,
    lastError,
    processInvite
  };
};
