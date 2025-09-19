import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CreditCard, DollarSign, Calculator, Plus, Upload, FileText, Filter } from 'lucide-react';
import { useFinancialData, FinancialSummary, CategorySummary, CardSummary } from '@/hooks/useFinancialData';
import { TransactionForm } from './TransactionForm';
import { CategoryDetailView } from './CategoryDetailView';
import { CardDetailView } from './CardDetailView';
import { CSVImport } from './CSVImport';
import { ReportGenerator } from './ReportGenerator';

interface FinancialDashboardProps {
  groupId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ groupId }) => {
  const { summary, loading, fetchTransactions, generateReport } = useFinancialData(groupId);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategorySummary | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardSummary | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'categories' | 'cards' | 'reports' | 'import'>('dashboard');

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Nenhum dado financeiro encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (value: number) => 
    `R$ ${value.toFixed(2).replace('.', ',')}`;

  const categoryChartData = summary.categories.map((cat, index) => ({
    name: cat.name,
    value: cat.total,
    percentage: cat.percentage,
    color: COLORS[index % COLORS.length]
  }));

  const cardChartData = summary.cards.map((card, index) => ({
    name: card.name,
    value: card.total,
    percentage: card.percentage,
    color: COLORS[index % COLORS.length]
  }));

  // Handle navigation and modals
  const handleTransactionSuccess = () => {
    fetchTransactions();
    setShowTransactionForm(false);
  };

  const handleCSVSuccess = () => {
    fetchTransactions();
    setShowCSVImport(false);
  };

  const handleCategoryClick = (category: CategorySummary) => {
    setSelectedCategory(category);
    setActiveView('categories');
  };

  const handleCardClick = (card: CardSummary) => {
    setSelectedCard(card);
    setActiveView('cards');
  };

  // Render different views
  if (selectedCategory) {
    return (
      <div className="p-6">
        <CategoryDetailView
          category={selectedCategory}
          onBack={() => {
            setSelectedCategory(null);
            setActiveView('dashboard');
          }}
        />
      </div>
    );
  }

  if (selectedCard) {
    return (
      <div className="p-6">
        <CardDetailView
          card={selectedCard}
          onBack={() => {
            setSelectedCard(null);
            setActiveView('dashboard');
          }}
          onGenerateReport={generateReport}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveView('import')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveView('reports')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
          <Button onClick={() => setShowTransactionForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={activeView === 'dashboard' ? 'default' : 'ghost'}
          onClick={() => setActiveView('dashboard')}
        >
          Dashboard
        </Button>
        <Button
          variant={activeView === 'categories' ? 'default' : 'ghost'}
          onClick={() => setActiveView('categories')}
        >
          Categorias
        </Button>
        <Button
          variant={activeView === 'cards' ? 'default' : 'ghost'}
          onClick={() => setActiveView('cards')}
        >
          Cartões
        </Button>
      </div>

      {/* Render content based on active view */}
      {activeView === 'import' && (
        <CSVImport
          groupId={groupId}
          onSuccess={handleCSVSuccess}
        />
      )}

      {activeView === 'reports' && (
        <ReportGenerator
          summary={summary}
          onGenerateReport={generateReport}
        />
      )}

      {activeView === 'categories' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.categories.map((category) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {category.transactions.length} transação{category.transactions.length !== 1 ? 'ões' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        R$ {category.total.toFixed(2).replace('.', ',')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {category.percentage.toFixed(1)}% do total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'cards' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Cartões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.cards.map((card) => (
                  <div
                    key={card.name}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleCardClick(card)}
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-8 h-8 text-blue-600" />
                      <div>
                        <h4 className="font-semibold">{card.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {card.type === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'} • {' '}
                          {card.transactions.length} transação{card.transactions.length !== 1 ? 'ões' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        R$ {card.total.toFixed(2).replace('.', ',')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {card.percentage.toFixed(1)}% do total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'dashboard' && (
        <>

      {/* Resumo Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Gastos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos no Crédito</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.totalCredit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos no Débito</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalDebit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Fixos</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(summary.totalFixed)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 3 Categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Top 3 Categorias de Gasto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.topCategories.map((category, index) => (
              <div 
                key={category.name} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                onClick={() => handleCategoryClick(category)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{category.percentage.toFixed(1)}% do total</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(category.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cartão com Maior Gasto */}
      {summary.topCard && (
        <Card>
          <CardHeader>
            <CardTitle>Cartão com Maior Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-colors cursor-pointer"
              onClick={() => handleCardClick(summary.topCard)}
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-lg">{summary.topCard.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {summary.topCard.type === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.topCard.total)}</p>
                <p className="text-sm text-muted-foreground">{summary.topCard.percentage.toFixed(1)}% do total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Categorias */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  onClick={(data) => {
                    const category = summary.categories.find(cat => cat.name === data.name);
                    if (category) handleCategoryClick(category);
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Cartões */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Cartão</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cardChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
        </>
      )}

      {/* Modals */}
      {showTransactionForm && (
        <TransactionForm
          groupId={groupId}
          onClose={() => setShowTransactionForm(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}
    </div>
  );
};