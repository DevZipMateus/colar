
-- Completamente recriar as políticas RLS para groups e group_members
-- Primeiro, remover todas as políticas existentes para garantir um estado limpo

-- Limpar todas as políticas da tabela groups
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON public.groups;

-- Limpar todas as políticas da tabela group_members  
DROP POLICY IF EXISTS "Users can view group members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

-- Recriar políticas para groups com lógica mais simples e direta
CREATE POLICY "Allow users to create groups" ON public.groups
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow users to view their groups" ON public.groups
  FOR SELECT 
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    public.is_user_group_member(auth.uid(), id)
  );

CREATE POLICY "Allow group creators to update groups" ON public.groups
  FOR UPDATE 
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Recriar políticas para group_members
CREATE POLICY "Allow users to join groups" ON public.group_members
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view group memberships" ON public.group_members
  FOR SELECT 
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    public.is_user_group_member(auth.uid(), group_id)
  );

-- Garantir que as tabelas tenham RLS habilitado
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
