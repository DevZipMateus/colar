
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { InviteError } from '@/hooks/useInviteHandler';

interface InviteActionsProps {
  processing: boolean;
  lastError: InviteError | null;
  onProcessInvite: () => void;
  onRetry: () => void;
  onShowManualEntry: () => void;
}

const InviteActions = ({ 
  processing, 
  lastError, 
  onProcessInvite, 
  onRetry, 
  onShowManualEntry 
}: InviteActionsProps) => {
  return (
    <div className="flex space-x-2">
      <Button
        onClick={onProcessInvite}
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
          onClick={onRetry}
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
        onClick={onShowManualEntry}
      >
        Manual
      </Button>
    </div>
  );
};

export default InviteActions;
