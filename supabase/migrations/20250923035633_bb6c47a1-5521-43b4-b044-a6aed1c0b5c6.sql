-- Limpar pagamentos duplicados da divisão "Contas da Casa"
-- Manter apenas os pagamentos mais recentes para cada usuário

-- Primeiro, identificar os IDs dos pagamentos mais recentes para cada usuário
WITH latest_payments AS (
  SELECT DISTINCT ON (sp.user_id) sp.id
  FROM split_payments sp
  WHERE sp.split_id = 'e79b287c-f355-4595-86a3-0e91dbb9f87c'
  ORDER BY sp.user_id, sp.created_at DESC
)
-- Deletar todos os pagamentos que não são os mais recentes
DELETE FROM split_payments 
WHERE split_id = 'e79b287c-f355-4595-86a3-0e91dbb9f87c'
AND id NOT IN (SELECT id FROM latest_payments);

-- Verificar o resultado
SELECT 
  sp.*,
  p.name as user_name
FROM split_payments sp
LEFT JOIN profiles p ON sp.user_id = p.id
WHERE sp.split_id = 'e79b287c-f355-4595-86a3-0e91dbb9f87c'
ORDER BY sp.user_id;