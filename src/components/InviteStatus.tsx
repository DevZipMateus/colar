
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InviteStatusProps {
  onResendConfirmation?: () => void;
  onRetry?: () => void;
  loading?: boolean;
}

const InviteStatus = ({ onResendConfirmation, onRetry, loading }: InviteStatusProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  console.log('📧 InviteStatus - User email status:', {
    user: user?.email,
    emailConfirmed: user?.email_confirmed_at,
    isConfirmed: user?.email_confirmed_at !== null
  });

  if (!user) return null;

  const isEmailConfirmed = user.email_confirmed_at !== null;

  const handleResendConfirmation = async () => {
    if (!user?.email) {
      toast({
        title: "Erro",
        description: "Email não encontrado",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📤 Resending confirmation email to:', user.email);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('❌ Error resending confirmation:', error);
        toast({
          title: "Erro ao reenviar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('✅ Confirmation email resent successfully');
        toast({
          title: "Email reenviado!",
          description: "Verifique sua caixa de entrada para o novo email de confirmação.",
        });
      }
    } catch (error) {
      console.error('💥 Unexpected error resending confirmation:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao reenviar email",
        variant: "destructive",
      });
    }
  };

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
                  <Button
                    onClick={onResendConfirmation || handleResendConfirmation}
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
