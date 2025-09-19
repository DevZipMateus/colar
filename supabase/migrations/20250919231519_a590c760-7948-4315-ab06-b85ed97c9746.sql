-- Insert default credit cards for all groups
INSERT INTO public.card_configurations (group_id, card_name, card_type, created_by) 
SELECT 
  g.id as group_id,
  card.name,
  'credit',
  g.created_by
FROM (
  VALUES 
    ('Cartão de Crédito Nubank'),
    ('Cartão de Crédito Magalu'),
    ('Cartão de Crédito Banrisul'),
    ('Cartão de Crédito Renner'),
    ('Cartão de Crédito Carrefour')
) AS card(name)
CROSS JOIN public.groups g
WHERE NOT EXISTS (
  SELECT 1 FROM public.card_configurations cc 
  WHERE cc.group_id = g.id AND cc.card_name = card.name
);