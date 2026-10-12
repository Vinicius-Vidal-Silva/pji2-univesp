-- Tabelas camada BRONZE
-- 1. Criação da tabela de Usuários (usuarios)
-- Integrado ao auth.users padrão do Supabase para gestão de autenticação
CREATE TABLE public.usuarios (
    id uuid references auth.users(id) on delete cascade not null primary key,
    nome_completo varchar(255) not null,
    email varchar(255) unique not null,
    foto_perfil_url text,
    bio text,
    created_at timestamp with time zone default now()
);

-- 2. Criação da tabela de Livros (livros)
-- Representa o exemplar físico cadastrado pelo leitor
CREATE TABLE public.livros (
    id uuid default gen_random_uuid() primary key,
    dono_id uuid references public.usuarios(id) on delete cascade not null,
    isbn varchar(13),
    titulo varchar(255) not null,
    subtitulo varchar(255),
    autor varchar(255) not null,
    coautor varchar(255),
    volume_edicao varchar(50),
    idioma varchar(50) default 'Português' not null,
    tema_genero varchar(100) not null,
    estado_conservacao varchar(50) not null, -- Domínio: 'Novo', 'Seminovo', 'Marcas de Uso'
    status varchar(50) default 'Disponível' not null, -- Domínio: 'Disponível', 'Em Negociação', 'Trocado'
    foto_capa_url text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 3. Criação da tabela de Propostas de Troca (propostas_troca)
CREATE TABLE public.propostas_troca (
    id uuid default gen_random_uuid() primary key,
    ofertante_id uuid references public.usuarios(id) on delete cascade not null,
    recebedor_id uuid references public.usuarios(id) on delete cascade not null,
    livro_desejado_id uuid references public.livros(id) on delete cascade not null,
    status_proposta varchar(50) default 'Pendente' not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 4. Criação da tabela de Itens Ofertados (itens_ofertados)
CREATE TABLE public.itens_ofertados (
    id uuid default gen_random_uuid() primary key,
    proposta_id uuid references public.propostas_troca(id) on delete cascade not null,
    livro_ofertado_id uuid references public.livros(id) on delete cascade not null
);

CREATE TABLE public.wishlist (
    id uuid default gen_random_uuid() primary key,
    usuario_id uuid references public.usuarios(id) on delete cascade not null,
    titulo_desejado varchar(255) not null,
    autor_desejado varchar(255),
    created_at timestamp with time zone default now()
);

-- 6. Criação da tabela de Mensagens do Chat (mensagens_chat)
-- Para comunicação logística após a troca ser validada
CREATE TABLE public.mensagens_chat (
    id uuid default gen_random_uuid() primary key,
    troca_id uuid references public.propostas_troca(id) on delete cascade not null, -- Vincula a sala de chat à proposta
    remetente_id uuid references public.usuarios(id) on delete cascade not null,
    conteudo text not null,
    created_at timestamp with time zone default now() not null
);

-- Schemas analiticos do modelo Medallion
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;

-- Criação da tabela de administradores
CREATE TABLE public.administradores (
    id uuid references auth.users(id) on delete cascade not null primary key,
    created_at timestamp with time zone default now()
);

-- Tabelas camada SILVER
-- 2. Tabela da camada Silver (Prata) - Histórico SCD Tipo 2
CREATE TABLE silver.dim_livros_historico (
    pk_hash text primary key,
    business_key text not null,
    row_hash text not null,
    livro_id uuid not null,
    dono_id uuid not null,
    isbn varchar(13),
    tema_genero varchar(100),
    estado_conservacao varchar(50),
    status varchar(50),
    data_inicio timestamp with time zone default now() not null,
    data_fim timestamp with time zone,
    is_ativo boolean default true not null,
    is_baseline boolean default false not null
);

-- Tabelas camada GOLD
-- Remove as tabelas físicas da camada Gold criadas anteriormente
DROP TABLE IF EXISTS gold.fato_tempo_troca;
DROP TABLE IF EXISTS gold.fato_demanda_genero;

-- Criação da VIEW Gold 1: Demanda e Conversão por Gênero
CREATE OR REPLACE VIEW gold.vw_fato_demanda_genero AS
SELECT 
    tema_genero,
    COUNT(id) AS total_livros_cadastrados,
    SUM(CASE WHEN status IN ('Em Negociação', 'Trocado') THEN 1 ELSE 0 END) AS total_trocas_concluidas,
    ROUND((SUM(CASE WHEN status IN ('Em Negociação', 'Trocado') THEN 1 ELSE 0 END)::numeric / COUNT(id)::numeric) * 100, 2) AS taxa_conversao_percentual
FROM public.livros
GROUP BY tema_genero;

-- Criação da VIEW Gold 2: Tempo de Troca (Consulta o histórico Silver)
CREATE OR REPLACE VIEW gold.vw_fato_tempo_troca AS
SELECT 
    l.id AS livro_id,
    l.titulo,
    l.tema_genero,
    MIN(h_disp.data_inicio) AS data_cadastro,
    MAX(h_negoc.data_inicio) AS data_troca,
    EXTRACT(DAY FROM (MAX(h_negoc.data_inicio) - MIN(h_disp.data_inicio))) AS dias_para_troca
FROM public.livros l
LEFT JOIN silver.dim_livros_historico h_disp ON l.id = h_disp.livro_id AND h_disp.status = 'Disponível'
LEFT JOIN silver.dim_livros_historico h_negoc ON l.id = h_negoc.livro_id AND h_negoc.status = 'Em Negociação'
GROUP BY l.id, l.titulo, l.tema_genero
HAVING MAX(h_negoc.data_inicio) IS NOT NULL;

GRANT USAGE ON SCHEMA gold TO authenticated;
GRANT SELECT ON gold.vw_fato_demanda_genero TO authenticated;
GRANT SELECT ON gold.vw_fato_tempo_troca TO authenticated;

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
      (COUNT(l.id) FILTER (WHERE COALESCE(h.status, l.status) IN ('Em Negociação', 'Trocado')))::bigint AS total_livros_em_negociacao_ou_trocados,
      (COUNT(l.id) FILTER (WHERE COALESCE(h.status, l.status) = 'Trocado'))::bigint AS total_livros_trocados,
      ROUND(((COUNT(l.id) FILTER (WHERE COALESCE(h.status, l.status) IN ('Em Negociação', 'Trocado')))::numeric / NULLIF(COUNT(l.id), 0)::numeric) * 100, 2) AS taxa_conversao_percentual,
      ROUND(((COUNT(l.id) FILTER (WHERE COALESCE(h.status, l.status) = 'Trocado'))::numeric / NULLIF(COUNT(l.id), 0)::numeric) * 100, 2) AS taxa_troca_concluida_percentual
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
      ROUND(((EXTRACT(EPOCH FROM (MAX(h_neg.data_inicio) - MIN(h_disp.data_inicio))) / 86400)::numeric), 2) AS dias_para_troca
FROM public.livros l
JOIN silver.dim_livros_historico h_disp
    ON l.id = h_disp.livro_id AND h_disp.status = 'Disponível' AND h_disp.is_baseline = false
JOIN silver.dim_livros_historico h_neg
    ON l.id = h_neg.livro_id AND h_neg.status = 'Em Negociação' AND h_neg.is_baseline = false
GROUP BY l.id, l.titulo, l.tema_genero, l.created_at
HAVING MAX(h_neg.data_inicio) >= MIN(h_disp.data_inicio);

GRANT SELECT ON gold.vw_fato_usuarios TO authenticated;
GRANT SELECT ON gold.vw_fato_acervo_livros TO authenticated;
GRANT SELECT ON gold.vw_fato_propostas TO authenticated;
GRANT SELECT ON gold.vw_fato_demanda_genero TO authenticated;
GRANT SELECT ON gold.vw_fato_tempo_troca TO authenticated;

