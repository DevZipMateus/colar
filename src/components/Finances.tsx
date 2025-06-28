
import React, { useState } from 'react';
import { Plus, DollarSign, TrendingUp, TrendingDown, ShoppingCart, Home, Car, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Finances = () => {
  const [showAddExpense, setShowAddExpense] = useState(false);

  const expenses = [
    { id: 1, description: 'Supermercado Extra', amount: 124.50, category: 'Mercado', user: 'João', date: '28/06/2025', icon: ShoppingCart },
    { id: 2, description: 'Conta de luz', amount: 89.30, category: 'Contas', user: 'Maria', date: '27/06/2025', icon: Home },
    { id: 3, description: 'Gasolina', amount: 75.00, category: 'Transporte', user: 'João', date: '26/06/2025', icon: Car },
    { id: 4, description: 'Café da manhã', amount: 23.80, category: 'Alimentação', user: 'Maria', date: '26/06/2025', icon: Coffee },
  ];

  const categories = [
    { name: 'Mercado', color: 'bg-green-500', amount: 824.50 },
    { name: 'Contas', color: 'bg-blue-500', amount: 567.30 },
    { name: 'Transporte', color: 'bg-purple-500', amount: 345.00 },
    { name: 'Alimentação', color: 'bg-orange-500', amount: 234.80 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Controle Financeiro</h2>
        <Button 
          onClick={() => setShowAddExpense(true)}
          className="bg-home-green hover:bg-home-green/90"
        >
          <Plus size={16} className="mr-2" />
          Adicionar
        </Button>
      </div>

      {/* Resumo Mensal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Gastos (Junho)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-red-500" size={20} />
              <span className="text-2xl font-bold text-gray-900">R$ 2.847,60</span>
            </div>
            <p className="text-sm text-red-500 mt-1">+12% vs maio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Divisão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">João</span>
                <span className="text-sm font-semibold">R$ 1.423,80</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Maria</span>
                <span className="text-sm font-semibold">R$ 1.423,80</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gastos por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm font-semibold">R$ {category.amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full ${category.color}`}
                      style={{ width: `${(category.amount / 824.50) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenses.map((expense) => {
              const Icon = expense.icon;
              return (
                <div key={expense.id} className="flex items-center space-x-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-home-green/20 rounded-full flex items-center justify-center">
                    <Icon size={16} className="text-home-green" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <p className="text-sm text-gray-500">{expense.category} • {expense.user} • {expense.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">R$ {expense.amount.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal para adicionar despesa (simplificado) */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Adicionar Despesa</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Descrição da despesa"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-home-green focus:border-transparent"
              />
              <input 
                type="number" 
                placeholder="Valor (R$)"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-home-green focus:border-transparent"
              />
              <select className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-home-green focus:border-transparent">
                <option>Selecione a categoria</option>
                <option>Mercado</option>
                <option>Contas</option>
                <option>Transporte</option>
                <option>Alimentação</option>
                <option>Lazer</option>
              </select>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setShowAddExpense(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => setShowAddExpense(false)}
                  className="flex-1 bg-home-green hover:bg-home-green/90"
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finances;
