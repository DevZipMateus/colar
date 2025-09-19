-- Insert default expense categories with appropriate colors and icons
INSERT INTO public.expense_categories (group_id, name, color, icon, created_by) 
SELECT 
  g.id as group_id,
  category.name,
  category.color,
  category.icon,
  g.created_by
FROM (
  VALUES 
    ('Mercado', '#10b981', 'ShoppingCart'),
    ('Despesas eventuais', '#6b7280', 'AlertCircle'),
    ('Necessidades', '#3b82f6', 'Home'),
    ('Roupas', '#8b5cf6', 'Shirt'),
    ('Saúde', '#ef4444', 'Heart'),
    ('Presentes', '#f59e0b', 'Gift'),
    ('Beleza', '#ec4899', 'Sparkles'),
    ('Educação', '#06b6d4', 'BookOpen'),
    ('Lazer', '#84cc16', 'Gamepad2'),
    ('Eletrônicos', '#64748b', 'Smartphone'),
    ('Assinaturas', '#f97316', 'CreditCard'),
    ('99/Transporte', '#eab308', 'Car'),
    ('IFood/Restaurante', '#dc2626', 'UtensilsCrossed'),
    ('Aluguel', '#0891b2', 'Building'),
    ('Contas', '#7c3aed', 'FileText')
) AS category(name, color, icon)
CROSS JOIN public.groups g
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories ec 
  WHERE ec.group_id = g.id AND ec.name = category.name
);