
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ShoppingCart, Home, Car, Coffee, Trash2, Utensils, Gamepad2, Edit2, AlertCircle, Heart, Gift, Sparkles, BookOpen, Smartphone, CreditCard, UtensilsCrossed, Building, Receipt, Shirt } from 'lucide-react';

interface CategoryManagerProps {
  categories: any[];
  onCreateCategory: (name: string, color: string, icon: string) => Promise<any>;
  onUpdateCategory: (categoryId: string, name: string, color: string, icon: string) => Promise<any>;
  onDeleteCategory: (categoryId: string) => Promise<any>;
}

const CategoryManager = ({ categories, onCreateCategory, onUpdateCategory, onDeleteCategory }: CategoryManagerProps) => {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#f97316');
  const [selectedIcon, setSelectedIcon] = useState('ShoppingCart');
  const [loading, setLoading] = useState(false);

  const iconOptions = [
    { name: 'ShoppingCart', Icon: ShoppingCart },
    { name: 'AlertCircle', Icon: AlertCircle },
    { name: 'Home', Icon: Home },
    { name: 'Shirt', Icon: Shirt },
    { name: 'Heart', Icon: Heart },
    { name: 'Gift', Icon: Gift },
    { name: 'Sparkles', Icon: Sparkles },
    { name: 'BookOpen', Icon: BookOpen },
    { name: 'Gamepad2', Icon: Gamepad2 },
    { name: 'Smartphone', Icon: Smartphone },
    { name: 'CreditCard', Icon: CreditCard },
    { name: 'Car', Icon: Car },
    { name: 'UtensilsCrossed', Icon: UtensilsCrossed },
    { name: 'Building', Icon: Building },
    { name: 'Receipt', Icon: Receipt },
    { name: 'Coffee', Icon: Coffee },
    { name: 'Utensils', Icon: Utensils },
  ];

  const colorOptions = [
    '#22c55e', // green (Mercado)
    '#f59e0b', // amber (Despesas eventuais)
    '#3b82f6', // blue (Necessidades)
    '#8b5cf6', // violet (Roupas)
    '#ef4444', // red (Saúde)
    '#ec4899', // pink (Presentes)
    '#f97316', // orange (Beleza)
    '#06b6d4', // cyan (Educação)
    '#84cc16', // lime (Lazer)
    '#6366f1', // indigo (Eletrônicos)
    '#64748b', // slate (Assinaturas)
    '#eab308', // yellow (99/Transporte)
    '#dc2626', // red-600 (IFood/Restaurante)
    '#059669', // emerald (Aluguel)
    '#7c3aed', // violet-600 (Contas)
  ];

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setLoading(true);
    const result = await onCreateCategory(categoryName.trim(), selectedColor, selectedIcon);
    
    if (!result?.error) {
      setShowAddCategory(false);
      resetForm();
    }
    
    setLoading(false);
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !editingCategory) return;

    setLoading(true);
    const result = await onUpdateCategory(editingCategory.id, categoryName.trim(), selectedColor, selectedIcon);
    
    if (!result?.error) {
      setEditingCategory(null);
      resetForm();
    }
    
    setLoading(false);
  };

  const resetForm = () => {
    setCategoryName('');
    setSelectedColor('#f97316');
    setSelectedIcon('ShoppingCart');
  };

  const startEditing = (category: any) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setSelectedColor(category.color);
    setSelectedIcon(category.icon);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setShowAddCategory(false);
    resetForm();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      await onDeleteCategory(categoryId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-colar-navy">Categorias de Despesas</CardTitle>
          <Button
            onClick={() => setShowAddCategory(true)}
            size="sm"
            className="bg-colar-orange hover:bg-colar-orange-dark text-white"
          >
            <Plus size={16} className="mr-1" />
            Nova
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((category) => {
            const IconComponent = iconOptions.find(opt => opt.name === category.icon)?.Icon || ShoppingCart;
            return (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                 <div className="flex items-center space-x-2 flex-1">
                   <div
                     className="w-8 h-8 rounded-full flex items-center justify-center"
                     style={{ backgroundColor: category.color + '20' }}
                   >
                     <IconComponent size={16} style={{ color: category.color }} />
                   </div>
                   <span className="text-sm font-medium text-colar-navy">{category.name}</span>
                 </div>
                 <div className="flex space-x-1">
                   <Button
                     onClick={() => startEditing(category)}
                     variant="ghost"
                     size="sm"
                     className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                   >
                     <Edit2 size={14} />
                   </Button>
                   <Button
                     onClick={() => handleDeleteCategory(category.id)}
                     variant="ghost"
                     size="sm"
                     className="text-red-500 hover:text-red-700 hover:bg-red-50"
                   >
                     <Trash2 size={14} />
                   </Button>
                 </div>
              </div>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart size={48} className="mx-auto mb-2 text-gray-300" />
            <p>Nenhuma categoria personalizada ainda.</p>
            <p className="text-sm">Crie uma para organizar suas despesas!</p>
          </div>
        )}

        {/* Modal para adicionar/editar categoria */}
        {(showAddCategory || editingCategory) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-colar-navy mb-4">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <form onSubmit={editingCategory ? handleEditCategory : handleCreateCategory} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome da categoria"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-colar-orange focus:border-transparent"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                  <div className="flex space-x-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ícone</label>
                  <div className="grid grid-cols-6 gap-2">
                    {iconOptions.map(({ name, Icon }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setSelectedIcon(name)}
                        className={`p-2 rounded-lg border ${
                          selectedIcon === name
                            ? 'border-colar-orange bg-colar-orange/10'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={20} className={selectedIcon === name ? 'text-colar-orange' : 'text-gray-600'} />
                      </button>
                    ))}
                  </div>
                </div>

                 <div className="flex space-x-3">
                   <Button
                     type="button"
                     onClick={cancelEditing}
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
                     {loading ? (editingCategory ? 'Salvando...' : 'Criando...') : (editingCategory ? 'Salvar' : 'Criar')}
                   </Button>
                 </div>
              </form>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryManager;
