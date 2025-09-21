-- Security Enhancement: Update database functions to include secure search_path
-- This prevents potential schema-based attacks

-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update the add_default_categories_to_group function
CREATE OR REPLACE FUNCTION public.add_default_categories_to_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Update the generate_recurring_expenses function
CREATE OR REPLACE FUNCTION public.generate_recurring_expenses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.expenses (group_id, description, amount, category, created_by, is_recurring, recurrence_type, due_date, next_due_date)
  SELECT 
    group_id,
    description,
    amount,
    category,
    created_by,
    is_recurring,
    recurrence_type,
    CURRENT_DATE,
    CASE 
      WHEN recurrence_type = 'monthly' THEN CURRENT_DATE + INTERVAL '1 month'
      WHEN recurrence_type = 'weekly' THEN CURRENT_DATE + INTERVAL '1 week'
      WHEN recurrence_type = 'yearly' THEN CURRENT_DATE + INTERVAL '1 year'
    END
  FROM public.expenses
  WHERE is_recurring = true 
    AND next_due_date <= CURRENT_DATE;
    
  -- Atualizar próxima data de vencimento
  UPDATE public.expenses
  SET next_due_date = CASE 
    WHEN recurrence_type = 'monthly' THEN next_due_date + INTERVAL '1 month'
    WHEN recurrence_type = 'weekly' THEN next_due_date + INTERVAL '1 week'
    WHEN recurrence_type = 'yearly' THEN next_due_date + INTERVAL '1 year'
  END
  WHERE is_recurring = true 
    AND next_due_date <= CURRENT_DATE;
END;
$function$;

-- Update the is_user_group_member function
CREATE OR REPLACE FUNCTION public.is_user_group_member(user_id uuid, group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.group_members 
    WHERE group_members.user_id = $1 
    AND group_members.group_id = $2
  );
$function$;

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (new.id, new.raw_user_meta_data ->> 'name', new.email);
  RETURN new;
END;
$function$;

-- Security Enhancement: Add missing RLS policies for inventory_items table
-- This enables full CRUD functionality with proper security

-- Add UPDATE policy for inventory_items
CREATE POLICY "Users can update inventory items in their groups"
ON public.inventory_items
FOR UPDATE
USING (group_id IN (
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
))
WITH CHECK (group_id IN (
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
));

-- Add DELETE policy for inventory_items
CREATE POLICY "Users can delete inventory items in their groups"
ON public.inventory_items
FOR DELETE
USING (group_id IN (
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
));