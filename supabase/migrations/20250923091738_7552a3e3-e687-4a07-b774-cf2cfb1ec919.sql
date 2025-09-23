-- Alterar "Seller" para "Individual" na tabela team_members
UPDATE team_members 
SET position = 'Individual' 
WHERE position = 'Seller';

-- Atualizar datas específicas dos membros
UPDATE team_members 
SET date_added = '2025-07-03T00:00:00.000Z' 
WHERE name IN ('Pedro Iago', 'Rafael Peixoto');

UPDATE team_members 
SET date_added = '2003-07-15T00:00:00.000Z' 
WHERE name = 'Sinclair';

UPDATE team_members 
SET date_added = '1992-02-04T00:00:00.000Z' 
WHERE name = 'Willer';