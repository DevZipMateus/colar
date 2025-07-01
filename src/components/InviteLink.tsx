
import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface InviteLinkProps {
  inviteCode: string;
  groupName: string;
}

const InviteLink = ({ inviteCode, groupName }: InviteLinkProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const inviteUrl = `${window.location.origin}?invite=${inviteCode}`;

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link de convite foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const shareInviteLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convite para ${groupName}`,
          text: `Você foi convidado para participar do grupo "${groupName}" no CoLar!`,
          url: inviteUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyInviteLink();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Link de Convite</label>
        <div className="flex items-center space-x-2">
          <input 
            type="text" 
            value={inviteUrl}
            readOnly
            className="flex-1 p-3 border border-gray-200 rounded-lg bg-gray-50 text-sm"
          />
          <Button
            onClick={copyInviteLink}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </Button>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button
          onClick={shareInviteLink}
          className="flex-1 bg-colar-navy hover:bg-colar-navy-dark text-white flex items-center justify-center space-x-2"
        >
          <Share2 size={16} />
          <span>Compartilhar Link</span>
        </Button>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p><strong>Como usar:</strong></p>
        <p>• Copie e envie este link para as pessoas que você quer convidar</p>
        <p>• Quando elas clicarem no link, serão automaticamente direcionadas para entrar no grupo</p>
        <p>• O código do grupo é: <span className="font-mono font-bold">{inviteCode}</span></p>
      </div>
    </div>
  );
};

export default InviteLink;
