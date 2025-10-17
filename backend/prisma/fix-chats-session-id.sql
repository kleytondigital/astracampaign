-- ============================================================================
-- FIX: Atualizar chats sem sessionId
-- Data: 7 de outubro de 2025, 04:35
-- ============================================================================
--
-- Este script corrige chats criados automaticamente pelo WebSocket
-- que não tinham sessionId associado, impedindo o envio de mensagens.
--
-- ============================================================================

-- Atualizar chats sem sessionId com a primeira sessão ativa do tenant
UPDATE chats c
SET session_id = (
  SELECT ws.id
  FROM whatsapp_sessions ws
  WHERE ws.tenant_id = c.tenant_id
    AND ws.status = 'CONNECTED'
  ORDER BY ws.criado_em ASC
  LIMIT 1
)
WHERE c.session_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM whatsapp_sessions ws
    WHERE ws.tenant_id = c.tenant_id
      AND ws.status = 'CONNECTED'
  );

-- Verificar quantos chats foram atualizados
SELECT 
  COUNT(*) as chats_atualizados,
  c.tenant_id,
  t.nome as tenant_nome
FROM chats c
JOIN tenants t ON t.id = c.tenant_id
WHERE c.session_id IS NOT NULL
GROUP BY c.tenant_id, t.nome;

-- Verificar chats ainda sem sessão (caso não haja sessões conectadas)
SELECT 
  COUNT(*) as chats_sem_sessao,
  c.tenant_id,
  t.nome as tenant_nome
FROM chats c
JOIN tenants t ON t.id = c.tenant_id
WHERE c.session_id IS NULL
GROUP BY c.tenant_id, t.nome;








