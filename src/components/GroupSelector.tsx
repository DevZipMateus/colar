
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, LogOut, ChevronDown } from 'lucide-react';
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
    <div className="bg-gradient-to-r from-colar-orange/5 to-colar-navy/5 border-b border-gray-100 shadow-sm">
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-10 h-10 bg-colar-orange rounded-full shadow-md">
              <Users className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <select
                  value={currentGroup?.id || ''}
                  onChange={(e) => {
                    const selected = groups.find(g => g.id === e.target.value);
                    setCurrentGroup(selected || null);
                  }}
                  className="text-xl font-bold text-colar-navy bg-transparent border-none focus:outline-none cursor-pointer appearance-none pr-2"
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="text-colar-navy/60" />
              </div>
              <p className="text-sm text-gray-600">
                {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'} • {currentGroup?.description || 'Sem descrição'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {currentGroup && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200/50 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">Código: {currentGroup.invite_code}</span>
              </div>
            )}
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="bg-white/70 backdrop-blur-sm border-gray-200/50 hover:bg-white/90 transition-all duration-200"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
        
        {/* Mobile code display */}
        {currentGroup && (
          <div className="sm:hidden mt-3 flex items-center justify-center">
            <div className="flex items-center space-x-2 px-3 py-2 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200/50 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-700">Código: {currentGroup.invite_code}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSelector;
