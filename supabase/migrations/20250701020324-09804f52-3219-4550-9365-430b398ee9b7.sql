
-- Criar políticas RLS para a tabela tasks para permitir que membros do grupo gerenciem as tarefas
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Política para permitir que membros do grupo visualizem tarefas
CREATE POLICY "Group members can view tasks" ON public.tasks
  FOR SELECT 
  TO authenticated
  USING (
    public.is_user_group_member(auth.uid(), group_id)
  );

-- Política para permitir que membros do grupo criem tarefas
CREATE POLICY "Group members can create tasks" ON public.tasks
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    public.is_user_group_member(auth.uid(), group_id)
  );

-- Política para permitir que membros do grupo atualizem tarefas
CREATE POLICY "Group members can update tasks" ON public.tasks
  FOR UPDATE 
  TO authenticated
  USING (
    public.is_user_group_member(auth.uid(), group_id)
  )
  WITH CHECK (
    public.is_user_group_member(auth.uid(), group_id)
  );

-- Política para permitir que membros do grupo excluam tarefas
CREATE POLICY "Group members can delete tasks" ON public.tasks
  FOR DELETE 
  TO authenticated
  USING (
    public.is_user_group_member(auth.uid(), group_id)
  );
