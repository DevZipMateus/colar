
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let result;
      
      if (isForgotPassword) {
        result = await resetPassword(email);
        if (result.error) {
          setError('Erro ao enviar email de recuperação');
        } else {
          setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
        }
      } else if (isLogin) {
        result = await signIn(email, password);
        if (result.error) {
          if (result.error.message.includes('Invalid login credentials')) {
            setError('Email ou senha incorretos');
          } else {
            setError(result.error.message);
          }
        }
      } else {
        if (!name.trim()) {
          setError('Nome é obrigatório');
          setLoading(false);
          return;
        }
        result = await signUp(email, password, name);
        if (result.error) {
          if (result.error.message.includes('User already registered')) {
            setError('Este email já está cadastrado. Tente fazer login.');
          } else if (result.error.message.includes('Password should be at least 6 characters')) {
            setError('A senha deve ter pelo menos 6 caracteres');
          } else {
            setError(result.error.message);
          }
        } else {
          setSuccess('Cadastro realizado! Verifique seu email para confirmar a conta.');
        }
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    }

    setLoading(false);
  };

  const getTitle = () => {
    if (isForgotPassword) return 'Recuperar Senha';
    return isLogin ? 'Entre na sua conta' : 'Crie sua conta';
  };

  const getDescription = () => {
    if (isForgotPassword) return 'Digite seu email para receber instruções de recuperação';
    return isLogin ? 'Entre na sua conta' : 'Crie sua conta';
  };

  return (
    <div className="min-h-screen bg-colar-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/lovable-uploads/b542af28-bc6f-48e6-bc41-ac0ce357de82.png" 
              alt="CoLar Logo" 
              className="w-12 h-12"
            />
            <CardTitle className="text-2xl font-bold text-colar-navy">
              CoLar
            </CardTitle>
          </div>
          <p className="text-gray-600">
            {getDescription()}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-orange focus:border-transparent"
                  placeholder="Seu nome"
                  required={!isLogin && !isForgotPassword}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-orange focus:border-transparent"
                placeholder="seu@email.com"
                required
              />
            </div>
            
            {!isForgotPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-orange focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-colar-orange hover:bg-colar-orange-dark text-white"
            >
              {loading ? 'Carregando...' : (
                isForgotPassword ? 'Enviar Email' : (isLogin ? 'Entrar' : 'Cadastrar')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {!isForgotPassword && (
              <>
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-colar-orange hover:text-colar-orange-dark text-sm block w-full"
                >
                  {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
                </button>
                
                {isLogin && (
                  <button
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </>
            )}
            
            {isForgotPassword && (
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccess('');
                }}
                className="text-colar-orange hover:text-colar-orange-dark text-sm"
              >
                Voltar ao login
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
