import React from 'react';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import CategoryManager from './CategoryManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExpenseCategoryManagerProps {
  groupId: string;
}

export const ExpenseCategoryManager: React.FC<ExpenseCategoryManagerProps> = ({ groupId }) => {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useExpenseCategories(groupId);

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <CategoryManager
        categories={categories}
        onCreateCategory={createCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
      />
    </div>
  );
};