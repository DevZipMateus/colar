
-- Criar tabela para categorias personalizadas de despesas
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#f97316', -- cor padrão laranja
  icon TEXT DEFAULT 'ShoppingCart',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de categorias
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para categorias
CREATE POLICY "Users can view categories of their groups" 
  ON public.expense_categories 
  FOR SELECT 
  USING (public.is_user_group_member(auth.uid(), group_id));

CREATE POLICY "Users can create categories in their groups" 
  ON public.expense_categories 
  FOR INSERT 
  WITH CHECK (public.is_user_group_member(auth.uid(), group_id));

CREATE POLICY "Users can update categories in their groups" 
  ON public.expense_categories 
  FOR UPDATE 
  USING (public.is_user_group_member(auth.uid(), group_id));

CREATE POLICY "Users can delete categories in their groups" 
  ON public.expense_categories 
  FOR DELETE 
  USING (public.is_user_group_member(auth.uid(), group_id));

-- Adicionar colunas de avatar/imagem aos perfis e grupos
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Criar bucket de storage para imagens
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Políticas para o bucket de avatars
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to delete their own avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
