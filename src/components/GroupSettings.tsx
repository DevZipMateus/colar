import React, { useState } from 'react';
import { useGroups } from '@/hooks/useGroups';
import { useGroupMembers } from '@/hooks/useGroupMembers';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Settings, 
  Users, 
  Copy, 
  Edit, 
  Save, 
  X, 
  UserPlus,
  Shield,
  Trash2
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
}

interface GroupSettingsProps {
  currentGroup: Group;
}

const GroupSettings = ({ currentGroup }: GroupSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(currentGroup.name);
  const [groupDescription, setGroupDescription] = useState(currentGroup.description || '');
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { fetchGroups } = useGroups();
  const { members, loading: membersLoading, fetchMembers, removeMember } = useGroupMembers(currentGroup.id);

  const isGroupAdmin = currentGroup.created_by === user?.id;

  const handleUpdateGroup = async () => {
    if (!isGroupAdmin) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({
          name: groupName,
          description: groupDescription
        })
        .eq('id', currentGroup.id);

      if (error) throw error;

      toast({
        title: "Grupo atualizado",
        description: "As informações do grupo foram atualizadas com sucesso.",
      });

      setIsEditing(false);
      await fetchGroups();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o grupo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(currentGroup.invite_code);
      toast({
        title: "Código copiado",
        description: "O código de convite foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setGroupName(currentGroup.name);
    setGroupDescription(currentGroup.description || '');
    setIsEditing(false);
  };

  const handleRemoveMember = async (member: any) => {
    // Não pode remover a si mesmo
    if (member.user_id === user?.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode remover a si mesmo do grupo.",
        variant: "destructive",
      });
      return;
    }

    // Não pode remover o criador do grupo
    if (member.user_id === currentGroup.created_by) {
      toast({
        title: "Ação não permitida",
        description: "O criador do grupo não pode ser removido.",
        variant: "destructive",
      });
      return;
    }

    const memberName = member.profiles?.name || member.profiles?.email || 'este membro';
    
    if (confirm(`Tem certeza que deseja remover ${memberName} do grupo?`)) {
      const result = await removeMember(member.id);
      
      if (result?.error) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Membro removido",
          description: `${memberName} foi removido do grupo com sucesso.`,
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings size={16} />
          Configurações
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={20} />
            Configurações do Grupo
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="invite">Convite</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Informações do Grupo
                  {isGroupAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
                    >
                      {isEditing ? <X size={16} /> : <Edit size={16} />}
                      {isEditing ? 'Cancelar' : 'Editar'}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nome do Grupo</label>
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                  <Textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                    rows={3}
                    placeholder="Adicione uma descrição para o grupo..."
                  />
                </div>
                {isEditing && (
                  <Button
                    onClick={handleUpdateGroup}
                    disabled={loading}
                    className="w-full bg-colar-orange hover:bg-colar-orange-dark"
                  >
                    <Save size={16} className="mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} />
                  Membros do Grupo ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {membersLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-colar-orange mx-auto"></div>
                    </div>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-colar-orange rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {member.profiles?.name?.charAt(0) || member.profiles?.email?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.profiles?.name || member.profiles?.email || 'Usuário'}
                            </p>
                            <p className="text-sm text-gray-500">{member.profiles?.email}</p>
                          </div>
                        </div>
                         <div className="flex items-center space-x-2">
                           <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                             {member.role === 'admin' ? (
                               <>
                                 <Shield size={12} className="mr-1" />
                                 Admin
                               </>
                             ) : (
                               'Membro'
                             )}
                           </Badge>
                           {member.user_id === currentGroup.created_by && (
                             <Badge variant="outline">Criador</Badge>
                           )}
                           {isGroupAdmin && 
                            member.user_id !== user?.id && 
                            member.user_id !== currentGroup.created_by && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleRemoveMember(member)}
                               className="text-red-600 hover:text-red-700 hover:bg-red-50"
                             >
                               <Trash2 size={14} />
                             </Button>
                           )}
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invite" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus size={20} />
                  Código de Convite
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-colar-orange/10 rounded-lg border border-colar-orange/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Código atual:</p>
                      <p className="text-2xl font-mono font-bold text-colar-orange">
                        {currentGroup.invite_code}
                      </p>
                    </div>
                    <Button
                      onClick={copyInviteCode}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Copy size={16} />
                      Copiar
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>Como funciona:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Compartilhe este código com pessoas que você deseja convidar</li>
                    <li>Elas podem usar o código na tela de "Participar de Grupo"</li>
                    <li>O código é único para este grupo e não expira</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GroupSettings;