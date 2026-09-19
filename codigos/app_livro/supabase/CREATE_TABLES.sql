-- Tabelas camada BRONZE(public)
CREATE TABLE public.usuarios (
    id uuid references auth.users(id) on delete cascade not null primary key,
    nome_completo varchar(255) not null,
    email varchar(255) unique not null,
    foto_perfil_url text,
    bio text,
    created_at timestamp with time zone default now()
);

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

CREATE TABLE public.propostas_troca (
    id uuid default gen_random_uuid() primary key,
    ofertante_id uuid references public.usuarios(id) on delete cascade not null,
    recebedor_id uuid references public.usuarios(id) on delete cascade not null,
    livro_desejado_id uuid references public.livros(id) on delete cascade not null,
    status_proposta varchar(50) default 'Pendente' not null, -- Domínio: 'Pendente', 'Aceita', 'Recusada', 'Cancelada'
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

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

CREATE TABLE public.mensagens_chat (
    id uuid default gen_random_uuid() primary key,
    troca_id uuid references public.propostas_troca(id) on delete cascade not null, -- Vincula a sala de chat à proposta
    remetente_id uuid references public.usuarios(id) on delete cascade not null,
    conteudo text not null,
    created_at timestamp with time zone default now() not null
);

-- Camada SILVER
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
    is_ativo boolean default true not null
);

-- Camada GOLDE
CREATE OR REPLACE VIEW gold.vw_fato_demanda_genero AS
SELECT 
    tema_genero,
    COUNT(id) AS total_livros_cadastrados,
    SUM(CASE WHEN status IN ('Em Negociação', 'Trocado') THEN 1 ELSE 0 END) AS total_trocas_concluidas,
    ROUND((SUM(CASE WHEN status IN ('Em Negociação', 'Trocado') THEN 1 ELSE 0 END)::numeric / COUNT(id)::numeric) * 100, 2) AS taxa_conversao_percentual
FROM public.livros
GROUP BY tema_genero;

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