
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ManualInviteFormProps {
  manualCode: string;
  processing: boolean;
  pendingInvite: string | null;
  onCodeChange: (code: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack?: () => void;
}

const ManualInviteForm = ({ 
  manualCode, 
  processing, 
  pendingInvite, 
  onCodeChange, 
  onSubmit, 
  onBack 
}: ManualInviteFormProps) => {
  return (
    <>
      <p className="text-sm text-gray-600 mb-3">
        Digite o código do grupo para participar:
      </p>
      <form onSubmit={onSubmit} className="space-y-2">
        <input
          type="text"
          value={manualCode}
          onChange={(e) => onCodeChange(e.target.value)}
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
          {pendingInvite && onBack && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBack}
            >
              Voltar
            </Button>
          )}
        </div>
      </form>
    </>
  );
};

export default ManualInviteForm;
