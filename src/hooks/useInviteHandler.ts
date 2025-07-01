
import { useEffect } from 'react';
import { useGroups } from './useGroups';
import { useToast } from './use-toast';

export const useInviteHandler = () => {
  const { joinGroup } = useGroups();
  const { toast } = useToast();

  useEffect(() => {
    const handleInviteFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteCode = urlParams.get('invite');

      if (inviteCode) {
        console.log('Processing invite code from URL:', inviteCode);
        
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
        }

        // Remove o parâmetro da URL para evitar múltiplas tentativas
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('invite');
        window.history.replaceState({}, '', newUrl.toString());
      }
    };

    handleInviteFromUrl();
  }, [joinGroup, toast]);
};
