-- Executar apos CREATE_TABLES.sql para expor o dashboard somente pela camada Gold.
-- Datas Bronze definem a data_referencia; eventos de status usam datas Silver.

CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;

ALTER TABLE silver.dim_livros_historico
  ADD COLUMN IF NOT EXISTS is_baseline boolean NOT NULL DEFAULT false;
ALTER TABLE silver.dim_livros_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins leem historico Silver" ON silver.dim_livros_historico;
CREATE POLICY "Admins leem historico Silver" ON silver.dim_livros_historico
  FOR SELECT TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE OR REPLACE FUNCTION silver.fn_atualiza_historico_livros()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, silver
AS $$
DECLARE
  v_business_key text;
  v_row_hash text;
  v_pk_hash text;
  v_active_row_hash text;
BEGIN
  v_business_key := COALESCE(NEW.isbn, 'SEM_ISBN') || '_' || NEW.dono_id::text || '_' || NEW.id::text;
  v_row_hash := md5(COALESCE(NEW.tema_genero, '') || COALESCE(NEW.estado_conservacao, '') || COALESCE(NEW.status, ''));

  IF TG_OP = 'UPDATE' THEN
    SELECT row_hash INTO v_active_row_hash
    FROM silver.dim_livros_historico
    WHERE livro_id = NEW.id AND is_ativo = true;

    IF v_row_hash = v_active_row_hash THEN
      RETURN NEW;
    END IF;

    UPDATE silver.dim_livros_historico
    SET data_fim = now(), is_ativo = false
    WHERE livro_id = NEW.id AND is_ativo = true;
  END IF;

  v_pk_hash := md5(v_business_key || clock_timestamp()::text || gen_random_uuid()::text);

  INSERT INTO silver.dim_livros_historico (
    pk_hash, business_key, row_hash, livro_id, dono_id, isbn,
    tema_genero, estado_conservacao, status, data_inicio, is_ativo, is_baseline
  ) VALUES (
    v_pk_hash, v_business_key, v_row_hash, NEW.id, NEW.dono_id, NEW.isbn,
    NEW.tema_genero, NEW.estado_conservacao, NEW.status, now(), true, false
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_livro_history_change ON public.livros;
CREATE TRIGGER on_livro_history_change
  AFTER INSERT OR UPDATE ON public.livros
  FOR EACH ROW EXECUTE FUNCTION silver.fn_atualiza_historico_livros();

-- Registra o estado conhecido dos livros legados sem tratá-lo como evento histórico real.
INSERT INTO silver.dim_livros_historico (
  pk_hash, business_key, row_hash, livro_id, dono_id, isbn,
  tema_genero, estado_conservacao, status, data_inicio, is_ativo, is_baseline
)
SELECT
  md5(l.id::text || clock_timestamp()::text || gen_random_uuid()::text),
  COALESCE(l.isbn, 'SEM_ISBN') || '_' || l.dono_id::text || '_' || l.id::text,
  md5(COALESCE(l.tema_genero, '') || COALESCE(l.estado_conservacao, '') || COALESCE(l.status, '')),
  l.id, l.dono_id, l.isbn, l.tema_genero, l.estado_conservacao, l.status,
  COALESCE(l.updated_at, l.created_at, now()), true, true
FROM public.livros l
WHERE NOT EXISTS (
  SELECT 1 FROM silver.dim_livros_historico h
  WHERE h.livro_id = l.id AND h.is_ativo = true
);

CREATE OR REPLACE VIEW gold.vw_fato_usuarios WITH (security_invoker = true) AS
SELECT created_at::date AS data_referencia,
       EXTRACT(YEAR FROM created_at)::integer AS ano,
       EXTRACT(MONTH FROM created_at)::integer AS mes,
       EXTRACT(QUARTER FROM created_at)::integer AS trimestre,
       COUNT(id)::bigint AS total_usuarios
FROM public.usuarios
GROUP BY created_at::date;

CREATE OR REPLACE VIEW gold.vw_fato_acervo_livros WITH (security_invoker = true) AS
SELECT l.id AS livro_id,
       l.titulo,
       l.tema_genero,
       l.estado_conservacao,
       COALESCE(h.status, l.status) AS status,
       l.created_at::date AS data_referencia,
       l.created_at AS data_cadastro_bronze,
       h.data_inicio AS data_inicio_status_silver,
       h.data_fim AS data_fim_status_silver,
       h.is_baseline AS status_silver_e_snapshot_base
FROM public.livros l
LEFT JOIN silver.dim_livros_historico h
       ON h.livro_id = l.id AND h.is_ativo = true;

CREATE OR REPLACE VIEW gold.vw_fato_propostas WITH (security_invoker = true) AS
SELECT id AS proposta_id,
       status_proposta,
       created_at::date AS data_referencia,
       created_at AS data_criacao_bronze,
       updated_at AS data_atualizacao_bronze
FROM public.propostas_troca;

DROP VIEW IF EXISTS gold.vw_fato_demanda_genero;
CREATE VIEW gold.vw_fato_demanda_genero WITH (security_invoker = true) AS
SELECT l.tema_genero,
       l.created_at::date AS data_referencia,
       EXTRACT(YEAR FROM l.created_at)::integer AS ano,
       EXTRACT(MONTH FROM l.created_at)::integer AS mes,
       EXTRACT(QUARTER FROM l.created_at)::integer AS trimestre,
       COUNT(l.id)::bigint AS total_livros_cadastrados,
       COUNT(l.id) FILTER (WHERE COALESCE(h.status, l.status) IN ('Em Negociação', 'Trocado'))::bigint AS total_livros_em_negociacao_ou_trocados,
       COUNT(l.id) FILTER (WHERE COALESCE(h.status, l.status) = 'Trocado')::bigint AS total_livros_trocados,
       ROUND((COUNT(l.id) FILTER (WHERE COALESCE(h.status, l.status) IN ('Em Negociação', 'Trocado'))::numeric / NULLIF(COUNT(l.id), 0)) * 100, 2) AS taxa_conversao_percentual,
       ROUND((COUNT(l.id) FILTER (WHERE COALESCE(h.status, l.status) = 'Trocado')::numeric / NULLIF(COUNT(l.id), 0)) * 100, 2) AS taxa_troca_concluida_percentual
FROM public.livros l
LEFT JOIN silver.dim_livros_historico h
       ON h.livro_id = l.id AND h.is_ativo = true
GROUP BY l.tema_genero, l.created_at::date;

DROP VIEW IF EXISTS gold.vw_fato_tempo_troca;
CREATE VIEW gold.vw_fato_tempo_troca WITH (security_invoker = true) AS
SELECT l.id AS livro_id,
       l.titulo,
       l.tema_genero,
       l.created_at::date AS data_referencia,
       EXTRACT(YEAR FROM l.created_at)::integer AS ano,
       EXTRACT(MONTH FROM l.created_at)::integer AS mes,
       EXTRACT(QUARTER FROM l.created_at)::integer AS trimestre,
       l.created_at AS data_criacao_bronze,
       MIN(h_disp.data_inicio) AS data_cadastro,
       MAX(h_neg.data_inicio) AS data_troca,
       MIN(h_disp.data_inicio) AS data_inicio_disponivel_silver,
       MAX(h_neg.data_inicio) AS data_inicio_negociacao_silver,
       ROUND((EXTRACT(EPOCH FROM (MAX(h_neg.data_inicio) - MIN(h_disp.data_inicio))) / 86400)::numeric, 2) AS dias_para_troca
FROM public.livros l
JOIN silver.dim_livros_historico h_disp
     ON l.id = h_disp.livro_id AND h_disp.status = 'Disponível' AND h_disp.is_baseline = false
JOIN silver.dim_livros_historico h_neg
     ON l.id = h_neg.livro_id AND h_neg.status = 'Em Negociação' AND h_neg.is_baseline = false
GROUP BY l.id, l.titulo, l.tema_genero, l.created_at
HAVING MAX(h_neg.data_inicio) >= MIN(h_disp.data_inicio);

GRANT USAGE ON SCHEMA gold TO authenticated;
GRANT USAGE ON SCHEMA silver TO authenticated;
GRANT SELECT ON silver.dim_livros_historico TO authenticated;
GRANT SELECT ON gold.vw_fato_usuarios TO authenticated;
GRANT SELECT ON gold.vw_fato_acervo_livros TO authenticated;
GRANT SELECT ON gold.vw_fato_propostas TO authenticated;
GRANT SELECT ON gold.vw_fato_demanda_genero TO authenticated;
GRANT SELECT ON gold.vw_fato_tempo_troca TO authenticated;

NOTIFY pgrst, 'reload schema';
