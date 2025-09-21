-- Inserir categorias padrão para todos os grupos existentes
INSERT INTO public.expense_categories (group_id, name, color, icon, created_by)
SELECT 
  g.id as group_id,
  category_data.name,
  category_data.color,
  category_data.icon,
  g.created_by
FROM public.groups g
CROSS JOIN (
  VALUES 
    ('Mercado', '#22c55e', 'ShoppingCart'),
    ('Despesas eventuais', '#f59e0b', 'AlertCircle'),
    ('Necessidades', '#3b82f6', 'Home'),
    ('Roupas', '#8b5cf6', 'Shirt'),
    ('Saúde', '#ef4444', 'Heart'),
    ('Presentes', '#ec4899', 'Gift'),
    ('Beleza', '#f97316', 'Sparkles'),
    ('Educação', '#06b6d4', 'BookOpen'),
    ('Lazer', '#84cc16', 'Gamepad2'),
    ('Eletrônicos', '#6366f1', 'Smartphone'),
    ('Assinaturas', '#64748b', 'CreditCard'),
    ('99/Transporte', '#eab308', 'Car'),
    ('IFood/Restaurante', '#dc2626', 'UtensilsCrossed'),
    ('Aluguel', '#059669', 'Building'),
    ('Contas', '#7c3aed', 'Receipt')
) AS category_data(name, color, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories ec 
  WHERE ec.group_id = g.id AND ec.name = category_data.name
);

-- Criar função para adicionar categorias padrão a novos grupos
CREATE OR REPLACE FUNCTION public.add_default_categories_to_group()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.expense_categories (group_id, name, color, icon, created_by)
  VALUES 
    (NEW.id, 'Mercado', '#22c55e', 'ShoppingCart', NEW.created_by),
    (NEW.id, 'Despesas eventuais', '#f59e0b', 'AlertCircle', NEW.created_by),
    (NEW.id, 'Necessidades', '#3b82f6', 'Home', NEW.created_by),
    (NEW.id, 'Roupas', '#8b5cf6', 'Shirt', NEW.created_by),
    (NEW.id, 'Saúde', '#ef4444', 'Heart', NEW.created_by),
    (NEW.id, 'Presentes', '#ec4899', 'Gift', NEW.created_by),
    (NEW.id, 'Beleza', '#f97316', 'Sparkles', NEW.created_by),
    (NEW.id, 'Educação', '#06b6d4', 'BookOpen', NEW.created_by),
    (NEW.id, 'Lazer', '#84cc16', 'Gamepad2', NEW.created_by),
    (NEW.id, 'Eletrônicos', '#6366f1', 'Smartphone', NEW.created_by),
    (NEW.id, 'Assinaturas', '#64748b', 'CreditCard', NEW.created_by),
    (NEW.id, '99/Transporte', '#eab308', 'Car', NEW.created_by),
    (NEW.id, 'IFood/Restaurante', '#dc2626', 'UtensilsCrossed', NEW.created_by),
    (NEW.id, 'Aluguel', '#059669', 'Building', NEW.created_by),
    (NEW.id, 'Contas', '#7c3aed', 'Receipt', NEW.created_by);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para adicionar categorias padrão automaticamente
CREATE TRIGGER trigger_add_default_categories
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.add_default_categories_to_group();