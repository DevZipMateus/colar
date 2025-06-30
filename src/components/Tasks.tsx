import React, { useState } from 'react';
import { Plus, CheckSquare, Clock, User, Calendar, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGroupMembers } from '@/hooks/useGroupMembers';

interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
}

interface TasksProps {
  currentGroup: Group;
}

const Tasks = ({ currentGroup }: TasksProps) => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Tirar o lixo', responsible: 'João', responsibleId: '1', dueDate: '28/06/2025', completed: false, priority: 'high' },
    { id: 2, title: 'Limpar banheiro', responsible: 'Maria', responsibleId: '2', dueDate: '28/06/2025', completed: false, priority: 'high' },
    { id: 3, title: 'Aspirar a sala', responsible: 'João', responsibleId: '1', dueDate: '29/06/2025', completed: false, priority: 'medium' },
    { id: 4, title: 'Lavar roupa', responsible: 'Maria', responsibleId: '2', dueDate: '30/06/2025', completed: false, priority: 'low' },
    { id: 5, title: 'Lavar louça', responsible: 'Maria', responsibleId: '2', dueDate: '27/06/2025', completed: true, priority: 'medium' },
  ]);

  const { members, loading: membersLoading } = useGroupMembers(currentGroup.id);

  const toggleTask = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(currentGroup.invite_code);
    // Toast notification would go here
  };

  const getMemberById = (memberId: string) => {
    return members.find(member => member.user_id === memberId);
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-colar-red/30 bg-colar-red/10';
      case 'medium': return 'border-colar-orange/30 bg-colar-orange/10';
      case 'low': return 'border-colar-navy/30 bg-colar-navy/10';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-colar-red';
      case 'medium': return 'bg-colar-orange';
      case 'low': return 'bg-colar-navy';
      default: return 'bg-gray-500';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-colar-navy">Tarefas - {currentGroup.name}</h2>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setShowInviteModal(true)}
            variant="outline"
            className="hidden md:flex"
          >
            <Plus size={16} className="mr-2" />
            Convidar
          </Button>
          <Button 
            onClick={() => setShowAddTask(true)}
            className="bg-colar-navy hover:bg-colar-navy-dark text-white"
          >
            <Plus size={16} className="mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-colar-red">{pendingTasks.length}</div>
            <div className="text-sm text-gray-600">Pendentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-colar-orange">{completedTasks.length}</div>
            <div className="text-sm text-gray-600">Concluídas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-colar-navy">{tasks.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Membros do Grupo */}
      {!membersLoading && members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-colar-navy">Membros do Grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={member.profiles?.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.profiles?.name || member.profiles?.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-colar-navy">
                    {member.profiles?.name || member.profiles?.email || 'Usuário'}
                  </span>
                  {member.role === 'admin' && (
                    <span className="text-xs bg-colar-orange text-white px-2 py-1 rounded-full">Admin</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tarefas Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-colar-navy">
            <Clock size={20} className="mr-2 text-colar-navy" />
            Tarefas Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingTasks.map((task) => {
              const member = getMemberById(task.responsibleId);
              return (
                <div 
                  key={task.id} 
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${getPriorityColor(task.priority)}`}
                >
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="w-5 h-5 rounded border-gray-300 text-colar-navy focus:ring-colar-navy"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-colar-navy">{task.title}</h3>
                        <div className={`w-2 h-2 rounded-full ${getPriorityDot(task.priority)}`}></div>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={member?.profiles?.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member?.profiles?.name || task.responsible)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member?.profiles?.name || task.responsible}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>{task.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {pendingTasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Todas as tarefas foram concluídas! 🎉</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tarefas Concluídas */}
      {completedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-colar-navy">
              <CheckSquare size={20} className="mr-2 text-colar-orange" />
              Tarefas Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedTasks.map((task) => {
                const member = getMemberById(task.responsibleId);
                return (
                  <div key={task.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-75">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="w-5 h-5 rounded border-gray-300 text-colar-orange focus:ring-colar-orange"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-600 line-through">{task.title}</h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Avatar className="w-4 h-4">
                              <AvatarImage src={member?.profiles?.avatar_url || ''} />
                              <AvatarFallback className="text-xs">
                                {getInitials(member?.profiles?.name || task.responsible)}
                              </AvatarFallback>
                          </Avatar>
                            <span>{member?.profiles?.name || task.responsible}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>{task.dueDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para convidar usuários */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-colar-navy mb-4">Convidar para o Grupo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Código de Convite</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    value={currentGroup.invite_code}
                    readOnly
                    className="flex-1 p-3 border border-gray-200 rounded-lg bg-gray-50 text-center font-mono"
                  />
                  <Button
                    onClick={copyInviteCode}
                    variant="outline"
                    size="sm"
                  >
                    <Copy size={16} />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Compartilhe este código com pessoas que você quer convidar para o grupo.
                </p>
              </div>
              <Button 
                onClick={() => setShowInviteModal(false)}
                className="w-full bg-colar-navy hover:bg-colar-navy-dark text-white"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para adicionar tarefa */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-colar-navy mb-4">Nova Tarefa</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Nome da tarefa"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-navy focus:border-transparent"
              />
              <select className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-navy focus:border-transparent">
                <option>Selecione o responsável</option>
                {members.map((member) => (
                  <option key={member.id} value={member.user_id}>
                    {member.profiles?.name || member.profiles?.email || 'Usuário'}
                  </option>
                ))}
              </select>
              <input 
                type="date" 
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-navy focus:border-transparent"
              />
              <select className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-navy focus:border-transparent">
                <option>Prioridade</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setShowAddTask(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 bg-colar-navy hover:bg-colar-navy-dark text-white"
                >
                  Criar Tarefa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
