import React from 'react';
import { DollarSign, CheckSquare, Package, TrendingUp, AlertCircle, ShoppingCart, Users, Activity } from 'lucide-react';
import InviteMembersModal from './InviteMembersModal';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useTasks } from '@/hooks/useTasks';
import { useActivityFeed } from '@/hooks/useActivityFeed';

interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
}

interface DashboardProps {
  currentGroup: Group;
}

const Dashboard = ({ currentGroup }: DashboardProps) => {
  const { summary, loading: financialLoading } = useFinancialData(currentGroup.id);
  const { tasks, loading: tasksLoading } = useTasks(currentGroup.id);
  const { activities, loading: activitiesLoading, formatActivityTime, getActivityIcon, getActivityColor } = useActivityFeed(currentGroup.id);

  // Calculate real data
  const currentMonthExpenses = summary?.totalExpenses || 0;
  const expenseGrowth = "Em breve"; // Placeholder até implementar comparação mensal

  const pendingTasks = tasks.filter(task => !task.completed);
  const todayTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const today = new Date().toDateString();
    return new Date(task.due_date).toDateString() === today && !task.completed;
  });

  const getIconComponent = (iconName: string) => {
    const iconComponents = {
      DollarSign,
      CheckSquare,
      Package,
      Users,
      Activity
    };
    return iconComponents[iconName as keyof typeof iconComponents] || Activity;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-colar-navy">Olá! 👋</h2>
          <p className="text-gray-600 mt-1">Bem-vindo ao {currentGroup.name}</p>
        </div>
        <div className="hidden md:block">
          <InviteMembersModal currentGroup={currentGroup} />
        </div>
      </div>

      {/* Mobile invite button */}
      <div className="md:hidden">
        <InviteMembersModal currentGroup={currentGroup} />
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-colar-orange to-colar-orange-light p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Gastos este mês</p>
              <p className="text-2xl font-bold">
                {financialLoading ? "..." : `R$ ${currentMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </p>
            </div>
            <DollarSign size={32} className="text-orange-100" />
          </div>
          <div className="flex items-center mt-4 text-orange-100">
            <TrendingUp size={16} className="mr-1" />
            <span className="text-sm">
              {financialLoading ? "..." : expenseGrowth}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-colar-navy to-colar-navy-light p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Tarefas pendentes</p>
              <p className="text-2xl font-bold">
                {tasksLoading ? "..." : pendingTasks.length}
              </p>
            </div>
            <CheckSquare size={32} className="text-blue-100" />
          </div>
          <div className="flex items-center mt-4 text-blue-100">
            <AlertCircle size={16} className="mr-1" />
            <span className="text-sm">
              {tasksLoading ? "..." : `${todayTasks.length} vencendo hoje`}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-colar-red to-colar-red-light p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Próxima funcionalidade</p>
              <p className="text-2xl font-bold">Em breve</p>
            </div>
            <Package size={32} className="text-red-100" />
          </div>
          <div className="flex items-center mt-4 text-red-100">
            <ShoppingCart size={16} className="mr-1" />
            <span className="text-sm">Inventário</span>
          </div>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-colar-navy mb-4">Atividades Recentes</h3>
        {activitiesLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => {
              const IconComponent = getIconComponent(getActivityIcon(activity.activity_type));
              const colorClass = getActivityColor(activity.activity_type);
              
              return (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 bg-${colorClass}/20 rounded-full flex items-center justify-center`}>
                    <IconComponent size={16} className={`text-${colorClass}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-colar-navy">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {activity.metadata?.amount && `R$ ${Number(activity.metadata.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • `}
                      {formatActivityTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma atividade</h3>
            <p className="mt-1 text-sm text-gray-500">Suas atividades aparecerão aqui.</p>
          </div>
        )}
      </div>

      {/* Tarefas de Hoje */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-colar-navy mb-4">Tarefas de Hoje</h3>
        {tasksLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse p-3 rounded-lg border">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : todayTasks.length > 0 ? (
          <div className="space-y-3">
            {todayTasks.map((task, index) => (
              <div key={task.id} className={`flex items-center space-x-3 p-3 rounded-lg border ${
                index % 2 === 0 
                  ? 'bg-colar-orange/10 border-colar-orange/30' 
                  : 'bg-colar-navy/10 border-colar-navy/30'
              }`}>
                <input 
                  type="checkbox" 
                  className={`rounded ${
                    index % 2 === 0 
                      ? 'border-colar-orange text-colar-orange focus:ring-colar-orange/20' 
                      : 'border-colar-navy text-colar-navy focus:ring-colar-navy/20'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-colar-navy">{task.title}</p>
                  <p className={`text-xs ${index % 2 === 0 ? 'text-colar-orange' : 'text-colar-navy'}`}>
                    Vence hoje • {task.assigned_to ? 'Atribuída' : 'Não atribuída'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma tarefa para hoje</h3>
            <p className="mt-1 text-sm text-gray-500">Você está em dia!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
