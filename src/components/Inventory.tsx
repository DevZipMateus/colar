
import React, { useState } from 'react';
import { Plus, Package, AlertTriangle, ShoppingCart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Inventory = () => {
  const [showAddItem, setShowAddItem] = useState(false);
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([
    { id: 1, name: 'Arroz', quantity: 2, unit: 'kg', status: 'ok', category: 'Alimentos', lastUpdated: 'João - há 2 dias' },
    { id: 2, name: 'Feijão', quantity: 1, unit: 'kg', status: 'low', category: 'Alimentos', lastUpdated: 'Maria - há 3 dias' },
    { id: 3, name: 'Detergente', quantity: 0, unit: 'un', status: 'out', category: 'Limpeza', lastUpdated: 'João - há 1 dia' },
    { id: 4, name: 'Papel higiênico', quantity: 8, unit: 'rolos', status: 'ok', category: 'Higiene', lastUpdated: 'Maria - há 1 semana' },
    { id: 5, name: 'Leite', quantity: 1, unit: 'L', status: 'low', category: 'Alimentos', lastUpdated: 'João - hoje' },
    { id: 6, name: 'Sabão em pó', quantity: 0, unit: 'kg', status: 'out', category: 'Limpeza', lastUpdated: 'Maria - há 2 dias' },
  ]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ok':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: Package, label: 'Em estoque' };
      case 'low':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle, label: 'Acabando' };
      case 'out':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: ShoppingCart, label: 'Precisa comprar' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Package, label: 'Desconhecido' };
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const statusCounts = {
    ok: items.filter(item => item.status === 'ok').length,
    low: items.filter(item => item.status === 'low').length,
    out: items.filter(item => item.status === 'out').length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Controle de Estoque</h2>
        <Button 
          onClick={() => setShowAddItem(true)}
          className="bg-home-purple hover:bg-home-purple/90"
        >
          <Plus size={16} className="mr-2" />
          Novo Item
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('ok')}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{statusCounts.ok}</div>
            <div className="text-sm text-gray-600">Em Estoque</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('low')}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{statusCounts.low}</div>
            <div className="text-sm text-gray-600">Acabando</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('out')}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{statusCounts.out}</div>
            <div className="text-sm text-gray-600">Precisa Comprar</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="whitespace-nowrap"
        >
          Todos ({items.length})
        </Button>
        <Button 
          variant={filter === 'ok' ? 'default' : 'outline'}
          onClick={() => setFilter('ok')}
          className="whitespace-nowrap"
        >
          Em Estoque ({statusCounts.ok})
        </Button>
        <Button 
          variant={filter === 'low' ? 'default' : 'outline'}
          onClick={() => setFilter('low')}
          className="whitespace-nowrap"
        >
          Acabando ({statusCounts.low})
        </Button>
        <Button 
          variant={filter === 'out' ? 'default' : 'outline'}
          onClick={() => setFilter('out')}
          className="whitespace-nowrap"
        >
          Precisa Comprar ({statusCounts.out})
        </Button>
      </div>

      {/* Lista de Itens */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const statusInfo = getStatusInfo(item.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-home-purple/20 rounded-full flex items-center justify-center">
                    <StatusIcon size={20} className="text-home-purple" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>{item.quantity} {item.unit}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{item.lastUpdated}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      Editar
                    </Button>
                  </div>
                </div>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Nenhum item encontrado para este filtro</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Compras Rápida */}
      {statusCounts.out > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart size={20} className="mr-2 text-red-500" />
              Lista de Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.filter(item => item.status === 'out').map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <span className="font-medium text-red-900">{item.name}</span>
                  <span className="text-sm text-red-600">{item.category}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para adicionar item */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Novo Item</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Nome do item"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-home-purple focus:border-transparent"
              />
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="number" 
                  placeholder="Quantidade"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-home-purple focus:border-transparent"
                />
                <input 
                  type="text" 
                  placeholder="Unidade (kg, L, un)"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-home-purple focus:border-transparent"
                />
              </div>
              <select className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-home-purple focus:border-transparent">
                <option>Selecione a categoria</option>
                <option>Alimentos</option>
                <option>Limpeza</option>
                <option>Higiene</option>
                <option>Outros</option>
              </select>
              <select className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-home-purple focus:border-transparent">
                <option>Status</option>
                <option value="ok">Em estoque</option>
                <option value="low">Acabando</option>
                <option value="out">Precisa comprar</option>
              </select>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setShowAddItem(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => setShowAddItem(false)}
                  className="flex-1 bg-home-purple hover:bg-home-purple/90"
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

export default Inventory;
