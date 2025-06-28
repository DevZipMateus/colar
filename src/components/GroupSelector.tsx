
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, LogOut } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { useAuth } from '@/contexts/AuthContext';

const GroupSelector = () => {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { groups, currentGroup, setCurrentGroup, createGroup, joinGroup } = useGroups();
  const { signOut } = useAuth();

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await createGroup(groupName, groupDescription);
    
    if (result?.error) {
      setError(result.error);
    } else {
      setShowCreateGroup(false);
      setGroupName('');
      setGroupDescription('');
    }
    
    setLoading(false);
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await joinGroup(inviteCode);
    
    if (result?.error) {
      setError(result.error);
    } else {
      setShowJoinGroup(false);
      setInviteCode('');
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (groups.length === 0) {
    return (
      <div className="min-h-screen bg-colar-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-colar-navy">
              Bem-vindo ao CoLar!
            </CardTitle>
            <p className="text-gray-600">
              Crie um grupo ou participe de um existente para começar
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setShowCreateGroup(true)}
              className="w-full bg-colar-orange hover:bg-colar-orange-dark text-white"
            >
              <Plus size={16} className="mr-2" />
              Criar Grupo
            </Button>
            <Button
              onClick={() => setShowJoinGroup(true)}
              variant="outline"
              className="w-full"
            >
              <Users size={16} className="mr-2" />
              Participar de Grupo
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full text-gray-600"
            >
              <LogOut size={16} className="mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>

        {/* Modal Criar Grupo */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-colar-navy mb-4">Criar Novo Grupo</h3>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome do grupo"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-orange focus:border-transparent"
                  required
                />
                <textarea
                  placeholder="Descrição (opcional)"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-orange focus:border-transparent"
                  rows={3}
                />
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCreateGroup(false);
                      setError('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-colar-orange hover:bg-colar-orange-dark text-white"
                  >
                    {loading ? 'Criando...' : 'Criar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Participar de Grupo */}
        {showJoinGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-colar-navy mb-4">Participar de Grupo</h3>
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <input
                  type="text"
                  placeholder="Código de convite"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toLowerCase())}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-orange focus:border-transparent"
                  required
                />
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowJoinGroup(false);
                      setError('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-colar-orange hover:bg-colar-orange-dark text-white"
                  >
                    {loading ? 'Participando...' : 'Participar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="text-colar-orange" size={20} />
          <select
            value={currentGroup?.id || ''}
            onChange={(e) => {
              const selected = groups.find(g => g.id === e.target.value);
              setCurrentGroup(selected || null);
            }}
            className="text-lg font-semibold text-colar-navy bg-transparent border-none focus:outline-none"
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          {currentGroup && (
            <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
              Código: {currentGroup.invite_code}
            </div>
          )}
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupSelector;
