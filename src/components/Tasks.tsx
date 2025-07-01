import React, { useState } from 'react';
import { Plus, CheckSquare, Clock, User, Calendar, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGroupMembers } from '@/hooks/useGroupMembers';
import { useTasks } from '@/hooks/useTasks';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import InviteLink from './InviteLink';

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
  const [newTask, setNewTask] = useState({
    title: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium',
  });

  const { members, loading: membersLoading } = useGroupMembers(currentGroup.id);
  const { tasks, loading: tasksLoading, createTask, deleteTask, toggleTaskCompletion } = useTasks(currentGroup.id);

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    await toggleTaskCompletion(taskId, !completed);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const getMemberById = (memberId: string) => {
    return members.find(member => member.user_id === memberId);
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;

    const success = await createTask({
      title: newTask.title,
      assigned_to: newTask.assigned_to || null,
      due_date: newTask.due_date || null,
      group_id: currentGroup.id,
    });

    if (success) {
      setNewTask({ title: '', assigned_to: '', due_date: '', priority: 'medium' });
      setShowAddTask(false);
    }
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sem prazo';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (tasksLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center">
        <div className="text-xl font-bold text-colar-navy">Carregando tarefas...</div>
      </div>
    );
  }

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
              const member = getMemberById(task.assigned_to || '');
              return (
                <div 
                  key={task.id} 
                  className="p-4 rounded-lg border-2 transition-all hover:shadow-md border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id, task.completed)}
                      className="w-5 h-5 rounded border-gray-300 text-colar-navy focus:ring-colar-navy"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-colar-navy">{task.title}</h3>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a tarefa "{task.title}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteTask(task.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        {task.assigned_to && (
                          <div className="flex items-center space-x-1">
                            <Avatar className="w-4 h-4">
                              <AvatarImage src={member?.profiles?.avatar_url || ''} />
                              <AvatarFallback className="text-xs">
                                {getInitials(member?.profiles?.name || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member?.profiles?.name || 'Usuário'}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>{formatDate(task.due_date)}</span>
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
                const member = getMemberById(task.assigned_to || '');
                return (
                  <div key={task.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-75">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id, task.completed)}
                        className="w-5 h-5 rounded border-gray-300 text-colar-orange focus:ring-colar-orange"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-600 line-through">{task.title}</h3>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                <Trash2 size={16} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a tarefa "{task.title}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          {task.assigned_to && (
                            <div className="flex items-center space-x-1">
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={member?.profiles?.avatar_url || ''} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(member?.profiles?.name || 'U')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member?.profiles?.name || 'Usuário'}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>{formatDate(task.due_date)}</span>
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-colar-navy mb-4">Convidar para o Grupo</h3>
            
            <InviteLink inviteCode={currentGroup.invite_code} groupName={currentGroup.name} />
            
            <Button 
              onClick={() => setShowInviteModal(false)}
              className="w-full mt-4 bg-colar-navy hover:bg-colar-navy-dark text-white"
            >
              Fechar
            </Button>
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
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-navy focus:border-transparent"
              />
              <select 
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-navy focus:border-transparent"
              >
                <option value="">Selecione o responsável (opcional)</option>
                {members.map((member) => (
                  <option key={member.id} value={member.user_id}>
                    {member.profiles?.name || member.profiles?.email || 'Usuário'}
                  </option>
                ))}
              </select>
              <input 
                type="date" 
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-navy focus:border-transparent"
              />
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setShowAddTask(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateTask}
                  className="flex-1 bg-colar-navy hover:bg-colar-navy-dark text-white"
                  disabled={!newTask.title.trim()}
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
