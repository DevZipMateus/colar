import { useEffect } from 'react';
import { useGroups } from './useGroups';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

export const useInviteHandler = () => {
  const { joinGroup } = useGroups();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleInviteFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteCode = urlParams.get('invite');

      if (inviteCode) {
        console.log('Processing invite code from URL:', inviteCode);
        
        if (!user) {
          // User not authenticated, store invite for later
          console.log('User not authenticated, storing invite for later');
          localStorage.setItem('pending_invite', inviteCode);
          
          // Clear URL but keep invite in localStorage
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('invite');
          window.history.replaceState({}, '', newUrl.toString());
          
          toast({
            title: "Convite detectado",
            description: "Faça login ou crie uma conta para participar do grupo.",
          });
          return;
        }

        // User is authenticated, try to join immediately
        console.log('User authenticated, processing invite immediately');
        const result = await joinGroup(inviteCode);
        
        if (result.error) {
          console.error('Error joining group:', result.error);
          toast({
            title: "Erro ao entrar no grupo",
            description: result.error,
            variant: "destructive",
          });
        } else {
          console.log('Successfully joined group via URL invite');
          toast({
            title: "Bem-vindo ao grupo!",
            description: `Você foi adicionado ao grupo "${result.data?.name}" com sucesso.`,
          });
        }

        // Clear both URL and localStorage
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('invite');
        window.history.replaceState({}, '', newUrl.toString());
        localStorage.removeItem('pending_invite');
      } else {
        // No invite in URL, check for pending invite
        const pendingInvite = localStorage.getItem('pending_invite');
        if (pendingInvite && user) {
          console.log('Processing pending invite from localStorage:', pendingInvite);
          
          const result = await joinGroup(pendingInvite);
          
          if (result.error) {
            console.error('Error processing pending invite:', result.error);
            toast({
              title: "Erro ao processar convite",
              description: result.error,
              variant: "destructive",
            });
          } else {
            console.log('Successfully processed pending invite');
            toast({
              title: "Bem-vindo ao grupo!",
              description: `Você foi adicionado ao grupo "${result.data?.name}" com sucesso.`,
            });
          }
          
          // Clear pending invite
          localStorage.removeItem('pending_invite');
        }
      }
    };

    // Only run when user state is determined (either null or valid user)
    if (user !== undefined) {
      handleInviteFromUrl();
    }
  }, [user, joinGroup, toast]);

  // Provide a manual retry function for edge cases
  const retryPendingInvite = async () => {
    const pendingInvite = localStorage.getItem('pending_invite');
    if (pendingInvite && user) {
      console.log('Manually retrying pending invite:', pendingInvite);
      
      const result = await joinGroup(pendingInvite);
      
      if (result.error) {
        toast({
          title: "Erro ao processar convite",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso!",
          description: `Você foi adicionado ao grupo "${result.data?.name}".`,
        });
        localStorage.removeItem('pending_invite');
      }
    }
  };

  return { retryPendingInvite };
};
