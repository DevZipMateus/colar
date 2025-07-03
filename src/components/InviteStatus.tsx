
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface InviteStatusProps {
  onResendConfirmation?: () => void;
  onRetry?: () => void;
  loading?: boolean;
}

const InviteStatus = ({ onResendConfirmation, onRetry, loading }: InviteStatusProps) => {
  const { user } = useAuth();

  if (!user) return null;

  const isEmailConfirmed = user.email_confirmed_at !== null;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {isEmailConfirmed ? (
            <CheckCircle className="text-green-600 mt-0.5" size={20} />
          ) : (
            <Mail className="text-blue-600 mt-0.5" size={20} />
          )}
          
          <div className="flex-1">
            <h4 className="font-medium text-blue-900">
              {isEmailConfirmed ? 'Email Confirmado' : 'Confirme seu Email'}
            </h4>
            
            <p className="text-sm text-blue-700 mt-1">
              {isEmailConfirmed 
                ? 'Seu email foi confirmado. Você pode participar de grupos.'
                : 'Para entrar em grupos, você precisa confirmar seu email primeiro.'
              }
            </p>
            
            {!isEmailConfirmed && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-blue-600">
                  Verifique sua caixa de entrada (e spam) para o email de confirmação.
                </p>
                
                <div className="flex space-x-2">
                  {onResendConfirmation && (
                    <Button
                      onClick={onResendConfirmation}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={14} className="mr-1 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail size={14} className="mr-1" />
                          Reenviar Email
                        </>
                      )}
                    </Button>
                  )}
                  
                  {onRetry && (
                    <Button
                      onClick={onRetry}
                      disabled={loading}
                      variant="outline" 
                      size="sm"
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      <RefreshCw size={14} className="mr-1" />
                      Tentar Novamente
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InviteStatus;
