
-- Atualizar política para permitir que usuários vejam perfis de membros dos mesmos grupos
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view profiles of group members" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.id
  )
);

-- Criar políticas para o bucket de avatares
INSERT INTO storage.policies (id, bucket_id, command, definition, check)
VALUES 
  ('avatars_select_policy', 'avatars', 'SELECT', 'auth.role() = ''authenticated''', null),
  ('avatars_insert_policy', 'avatars', 'INSERT', 'auth.role() = ''authenticated''', 'auth.role() = ''authenticated'''),
  ('avatars_update_policy', 'avatars', 'UPDATE', 'auth.role() = ''authenticated''', 'auth.role() = ''authenticated'''),
  ('avatars_delete_policy', 'avatars', 'DELETE', 'auth.role() = ''authenticated''', null)
ON CONFLICT (id) DO NOTHING;
