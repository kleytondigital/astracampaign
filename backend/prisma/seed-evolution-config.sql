-- ========================================
-- SEED: Configuração Global Evolution API
-- ========================================
-- Data: 7 de outubro de 2025
-- Descrição: Insere ou atualiza as configurações globais da Evolution API
-- ========================================

-- 1. Inserir ou atualizar configuração global
-- (Configure os valores abaixo com suas credenciais reais)

-- Verificar se já existe configuração global
DO $$
DECLARE
  v_settings_id UUID;
BEGIN
  -- Procurar por configuração global existente
  SELECT id INTO v_settings_id
  FROM "global_settings"
  WHERE "singleton" = true;

  IF v_settings_id IS NULL THEN
    -- Criar nova configuração global
    INSERT INTO "global_settings" (
      "id",
      "singleton",
      "evolution_host",
      "evolution_api_key",
      "waha_host",
      "waha_api_key",
      "created_at",
      "updated_at"
    ) VALUES (
      gen_random_uuid(),
      true,  -- singleton = true
      'https://evo.usezap.com.br',  -- ⚠️ ALTERE AQUI: Seu host Evolution
      'wtwHLYfFxI9n1zDR8zFFqNq8kVaWqdD2oLpcjVmXxX',  -- ⚠️ ALTERE AQUI: Sua API Key Evolution
      '',  -- Configure WAHA se necessário
      '',  -- Configure WAHA API Key se necessário
      NOW(),
      NOW()
    );
    RAISE NOTICE '✅ Configuração global CRIADA com sucesso!';
  ELSE
    -- Atualizar configuração global existente
    UPDATE "global_settings"
    SET
      "evolution_host" = 'https://evo.usezap.com.br',  -- ⚠️ ALTERE AQUI
      "evolution_api_key" = 'wtwHLYfFxI9n1zDR8zFFqNq8kVaWqdD2oLpcjVmXxX',  -- ⚠️ ALTERE AQUI
      "updated_at" = NOW()
    WHERE "singleton" = true;
    RAISE NOTICE '✅ Configuração global ATUALIZADA com sucesso!';
  END IF;
END $$;

-- 2. Verificar configuração
SELECT 
  'GLOBAL' as "Tipo",
  "evolution_host" as "Evolution Host",
  LEFT("evolution_api_key", 10) || '...' as "Evolution API Key (primeiros 10 chars)",
  "waha_host" as "WAHA Host",
  LEFT("waha_api_key", 10) || '...' as "WAHA API Key (primeiros 10 chars)",
  "created_at" as "Criado em",
  "updated_at" as "Atualizado em"
FROM "global_settings"
WHERE "singleton" = true;

-- ========================================
-- INSTRUÇÕES DE USO
-- ========================================
-- 1. Abra este arquivo
-- 2. Substitua os valores:
--    - evolution_host: URL da sua Evolution API (ex: https://evo.seudominio.com.br)
--    - evolution_api_key: Sua API Key da Evolution
-- 3. Execute este script no seu banco PostgreSQL
-- 4. Reinicie o backend: npm run dev
-- 5. Veja os logs de conexão WebSocket
--
-- LOGS ESPERADOS:
-- ✅ [Evolution WebSocket] Configurações encontradas:
--    Host: wss://evo.usezap.com.br
--    API Key: wtwHLYfFxI...
-- 🔌 [Evolution WebSocket] Conectando: oficina_e9f2ed4d...
-- ✅ [WebSocket] Conectado: oficina_e9f2ed4d
-- ========================================

