
import React from 'react';
import { DollarSign, CheckSquare, Package, TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Olá, Maria! 👋</h2>
          <p className="text-gray-600 mt-1">Bem-vinda de volta à sua Casa Conectada</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-home-green to-home-green-light p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Gastos este mês</p>
              <p className="text-2xl font-bold">R$ 2.847</p>
            </div>
            <DollarSign size={32} className="text-green-100" />
          </div>
          <div className="flex items-center mt-4 text-green-100">
            <TrendingUp size={16} className="mr-1" />
            <span className="text-sm">+12% vs mês anterior</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-home-blue to-home-blue-light p-6 rounded-xl text-white shadow-lg">
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

        <div className="bg-gradient-to-br from-home-purple to-home-purple-light p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Itens em falta</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <Package size={32} className="text-purple-100" />
          </div>
          <div className="flex items-center mt-4 text-purple-100">
            <ShoppingCart size={16} className="mr-1" />
            <span className="text-sm">Precisa comprar</span>
          </div>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividades Recentes</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-home-green/20 rounded-full flex items-center justify-center">
              <DollarSign size={16} className="text-home-green" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">João adicionou uma despesa</p>
              <p className="text-xs text-gray-500">Mercado - R$ 124,50 • há 2 horas</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-home-blue/20 rounded-full flex items-center justify-center">
              <CheckSquare size={16} className="text-home-blue" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Maria concluiu uma tarefa</p>
              <p className="text-xs text-gray-500">Lavar louça • há 4 horas</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-home-purple/20 rounded-full flex items-center justify-center">
              <Package size={16} className="text-home-purple" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">João atualizou o estoque</p>
              <p className="text-xs text-gray-500">Leite em pó • há 1 dia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tarefas de Hoje */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarefas de Hoje</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <input type="checkbox" className="rounded border-amber-300 text-amber-600 focus:ring-amber-200" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Tirar o lixo</p>
              <p className="text-xs text-amber-600">Vence hoje • João</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <input type="checkbox" className="rounded border-blue-300 text-blue-600 focus:ring-blue-200" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Limpar banheiro</p>
              <p className="text-xs text-blue-600">Vence hoje • Maria</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
