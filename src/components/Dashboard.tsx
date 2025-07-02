import React from 'react';
import { DollarSign, CheckSquare, Package, TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react';
import InviteMembersModal from './InviteMembersModal';

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
              <p className="text-2xl font-bold">R$ 2.847</p>
            </div>
            <DollarSign size={32} className="text-orange-100" />
          </div>
          <div className="flex items-center mt-4 text-orange-100">
            <TrendingUp size={16} className="mr-1" />
            <span className="text-sm">+12% vs mês anterior</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-colar-navy to-colar-navy-light p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Tarefas pendentes</p>
              <p className="text-2xl font-bold">5</p>
            </div>
            <CheckSquare size={32} className="text-blue-100" />
          </div>
          <div className="flex items-center mt-4 text-blue-100">
            <AlertCircle size={16} className="mr-1" />
            <span className="text-sm">2 vencendo hoje</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-colar-red to-colar-red-light p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Itens em falta</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <Package size={32} className="text-red-100" />
          </div>
          <div className="flex items-center mt-4 text-red-100">
            <ShoppingCart size={16} className="mr-1" />
            <span className="text-sm">Precisa comprar</span>
          </div>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-colar-navy mb-4">Atividades Recentes</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-colar-orange/20 rounded-full flex items-center justify-center">
              <DollarSign size={16} className="text-colar-orange" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-colar-navy">João adicionou uma despesa</p>
              <p className="text-xs text-gray-500">Mercado - R$ 124,50 • há 2 horas</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-colar-navy/20 rounded-full flex items-center justify-center">
              <CheckSquare size={16} className="text-colar-navy" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-colar-navy">Maria concluiu uma tarefa</p>
              <p className="text-xs text-gray-500">Lavar louça • há 4 horas</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-colar-red/20 rounded-full flex items-center justify-center">
              <Package size={16} className="text-colar-red" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-colar-navy">João atualizou o estoque</p>
              <p className="text-xs text-gray-500">Leite em pó • há 1 dia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tarefas de Hoje */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-colar-navy mb-4">Tarefas de Hoje</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-colar-orange/10 rounded-lg border border-colar-orange/30">
            <input type="checkbox" className="rounded border-colar-orange text-colar-orange focus:ring-colar-orange/20" />
            <div className="flex-1">
              <p className="text-sm font-medium text-colar-navy">Tirar o lixo</p>
              <p className="text-xs text-colar-orange">Vence hoje • João</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-colar-navy/10 rounded-lg border border-colar-navy/30">
            <input type="checkbox" className="rounded border-colar-navy text-colar-navy focus:ring-colar-navy/20" />
            <div className="flex-1">
              <p className="text-sm font-medium text-colar-navy">Limpar banheiro</p>
              <p className="text-xs text-colar-navy">Vence hoje • Maria</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
