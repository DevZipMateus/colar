import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";

export const PrivacySettings: React.FC = () => {
  const { profile, updateProfile, loading } = useUserProfile();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isProfilePublic, setIsProfilePublic] = useState(profile?.is_profile_public || false);
  const [showEmailInGroups, setShowEmailInGroups] = useState(profile?.show_email_in_groups || false);

  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setIsProfilePublic(profile.is_profile_public || false);
      setShowEmailInGroups(profile.show_email_in_groups || false);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await updateProfile({
        display_name: displayName || undefined,
        is_profile_public: isProfilePublic,
        show_email_in_groups: showEmailInGroups,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível atualizar as configurações de privacidade.",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Configurações de privacidade atualizadas com sucesso!",
        });
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro inesperado ao atualizar configurações.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando configurações...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Privacidade</CardTitle>
        <CardDescription>
          Controle como suas informações são exibidas para outros usuários
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="display-name">Nome de Exibição</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Como você quer ser chamado?"
            maxLength={50}
          />
          <p className="text-sm text-muted-foreground">
            Este nome será usado no lugar do seu nome completo nos grupos
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Perfil Público</Label>
            <p className="text-sm text-muted-foreground">
              Permitir que outros usuários vejam informações básicas do seu perfil
            </p>
          </div>
          <Switch
            checked={isProfilePublic}
            onCheckedChange={setIsProfilePublic}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Mostrar Email nos Grupos</Label>
            <p className="text-sm text-muted-foreground">
              Exibir seu email para outros membros dos grupos que você participa
            </p>
          </div>
          <Switch
            checked={showEmailInGroups}
            onCheckedChange={setShowEmailInGroups}
          />
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  );
};