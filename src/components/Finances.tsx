
import React, { useState } from 'react';
import { Plus, DollarSign, TrendingUp, TrendingDown, ShoppingCart, Home, Car, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import CategoryManager from './CategoryManager';

interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
}

interface FinancesProps {
  currentGroup: Group;
}

const Finances = ({ currentGroup }: FinancesProps) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { categories, loading: categoriesLoading, createCategory, deleteCategory } = useExpenseCategories(currentGroup.id);

  const expenses = [
    { id: 1, description: 'Supermercado Extra', amount: 124.50, category: 'Mercado', user: 'João', date: '28/06/2025', icon: ShoppingCart },
    { id: 2, description: 'Conta de luz', amount: 89.30, category: 'Contas', user: 'Maria', date: '27/06/2025', icon: Home },
    { id: 3, description: 'Gasolina', amount: 75.00, category: 'Transporte', user: 'João', date: '26/06/2025', icon: Car },
    { id: 4, description: 'Café da manhã', amount: 23.80, category: 'Alimentação', user: 'Maria', date: '26/06/2025', icon: Coffee },
  ];

  const defaultCategories = [
    { name: 'Mercado', color: '#f97316', amount: 824.50 },
    { name: 'Contas', color: '#1e293b', amount: 567.30 },
    { name: 'Transporte', color: '#ef4444', amount: 345.00 },
    { name: 'Alimentação', color: '#eab308', amount: 234.80 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-colar-navy">Controle Financeiro - {currentGroup.name}</h2>
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-colar-navy shadow-sm'
                  : 'text-gray-600 hover:text-colar-navy'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'bg-white text-colar-navy shadow-sm'
                  : 'text-gray-600 hover:text-colar-navy'
              }`}
            >
              Categorias
            </button>
          </div>
          <Button 
            onClick={() => setShowAddExpense(true)}
            className="bg-colar-orange hover:bg-colar-orange-dark text-white"
          >
            <Plus size={16} className="mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Navegação mobile */}
      <div className="md:hidden flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-colar-navy shadow-sm'
              : 'text-gray-600 hover:text-colar-navy'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'bg-white text-colar-navy shadow-sm'
              : 'text-gray-600 hover:text-colar-navy'
          }`}
        >
          Categorias
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Resumo Mensal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Gastos (Junho)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="text-colar-red" size={20} />
                  <span className="text-2xl font-bold text-colar-navy">R$ 2.847,60</span>
                </div>
                <p className="text-sm text-colar-red mt-1">+12% vs maio</p>
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
                    <span className="text-sm font-semibold text-colar-navy">R$ 1.423,80</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Maria</span>
                    <span className="text-sm font-semibold text-colar-navy">R$ 1.423,80</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gastos por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-colar-navy">Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {defaultCategories.map((category, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: category.color }}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-colar-navy">{category.name}</span>
                        <span className="text-sm font-semibold text-colar-navy">R$ {category.amount.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            backgroundColor: category.color,
                            width: `${(category.amount / 824.50) * 100}%` 
                          }}
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
              <CardTitle className="text-colar-navy">Despesas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses.map((expense) => {
                  const Icon = expense.icon;
                  return (
                    <div key={expense.id} className="flex items-center space-x-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-colar-orange/20 rounded-full flex items-center justify-center">
                        <Icon size={16} className="text-colar-orange" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-colar-navy">{expense.description}</p>
                        <p className="text-sm text-gray-500">{expense.category} • {expense.user} • {expense.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-colar-navy">R$ {expense.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <CategoryManager
          categories={categories}
          onCreateCategory={createCategory}
          onDeleteCategory={deleteCategory}
        />
      )}

      {/* Modal para adicionar despesa (simplificado) */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-colar-navy mb-4">Adicionar Despesa</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Descrição da despesa"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-orange focus:border-transparent"
              />
              <input 
                type="number" 
                placeholder="Valor (R$)"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-orange focus:border-transparent"
              />
              <select className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-orange focus:border-transparent">
                <option>Selecione a categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
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
                  className="flex-1 bg-colar-orange hover:bg-colar-orange-dark text-white"
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
