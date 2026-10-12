-- 1. Habilitar o RLS (Row Level Security) em todas as tabelas
alter table public.usuarios enable row level security;
alter table public.livros enable row level security;
alter table public.propostas_troca enable row level security;
alter table public.itens_ofertados enable row level security;
alter table public.wishlist enable row level security;
alter table public.mensagens_chat enable row level security;
alter table silver.dim_livros_historico enable row level security;
-- Habilitar RLS na tabela de administradores
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins leem historico Silver" ON silver.dim_livros_historico
FOR SELECT TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

GRANT USAGE ON SCHEMA silver TO authenticated;
GRANT SELECT ON silver.dim_livros_historico TO authenticated;

GRANT USAGE ON SCHEMA gold TO authenticated;
GRANT SELECT ON gold.vw_fato_demanda_genero TO authenticated;
GRANT SELECT ON gold.vw_fato_tempo_troca TO authenticated;

-- Buckets públicos usados para avatares e capas
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-perfil', 'fotos-perfil', true), ('fotos-capas', 'fotos-capas', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 2. Políticas para 'usuarios'
create policy "Perfis são públicos" on public.usuarios for select to public using (true);
create policy "Usuário altera próprio perfil" on public.usuarios for update to authenticated using (auth.uid() = id);
create policy "Usuário insere próprio perfil" on public.usuarios for insert to authenticated with check (auth.uid() = id);

-- 3. Políticas para 'livros' (A vitrine e a biblioteca pessoal)
create policy "Livros são públicos" on public.livros for select to public using (true);
create policy "Dono gerencia seus livros" on public.livros for all to authenticated using (auth.uid() = dono_id);

-- 4. Políticas para 'wishlist'
create policy "Wishlists são públicas" on public.wishlist for select to public using (true);
create policy "Dono gerencia sua wishlist" on public.wishlist for all to authenticated using (auth.uid() = usuario_id);

-- 5. Políticas para 'propostas_troca' (Privacidade do negócio)
create policy "Envolvidos veem a proposta" on public.propostas_troca for select to authenticated using (auth.uid() = ofertante_id or auth.uid() = recebedor_id);
create policy "Ofertante cria proposta" on public.propostas_troca for insert to authenticated with check (auth.uid() = ofertante_id);
create policy "Envolvidos atualizam status" on public.propostas_troca for update to authenticated using (auth.uid() = ofertante_id or auth.uid() = recebedor_id);

-- 6. Políticas para 'itens_ofertados'
create policy "Leitura pública de itens ofertados" on public.itens_ofertados for select to public using (true);
create policy "Usuário logado adiciona itens" on public.itens_ofertados for insert to authenticated with check (true); 

-- 7. Políticas para 'mensagens_chat'
create policy "Leitura do chat" on public.mensagens_chat for select to authenticated using (true);
create policy "Remetente envia mensagem" on public.mensagens_chat for insert to authenticated with check (auth.uid() = remetente_id);

-- Políticas para fotos de perfil
create policy "Visualização pública de avatares" on storage.objects for select to public using (bucket_id = 'fotos-perfil');
create policy "Usuário faz upload do próprio avatar" on storage.objects for insert to authenticated with check (bucket_id = 'fotos-perfil' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Usuário remove o próprio avatar" on storage.objects for delete to authenticated using (bucket_id = 'fotos-perfil' and auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas para fotos das capas de livros
create policy "Visualização pública de capas" on storage.objects for select to public using (bucket_id = 'fotos-capas');
create policy "Usuários cadastram capas de livros" on storage.objects for insert to authenticated with check (bucket_id = 'fotos-capas');

-- Apenas administradores podem ver quem é administrador
CREATE POLICY "Admins veem admins" ON public.administradores
FOR SELECT TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Acesso total a Perfis Privados (caso decida restringir perfis no futuro)
CREATE POLICY "Admins veem todos os usuarios" ON public.usuarios
FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Acesso total às Propostas de Troca
CREATE POLICY "Admins gerenciam todas as propostas" ON public.propostas_troca
FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Acesso total aos Itens Ofertados
CREATE POLICY "Admins veem todos os itens" ON public.itens_ofertados
FOR SELECT TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Acesso total às Mensagens (Auditoria)
CREATE POLICY "Admins auditam chats" ON public.mensagens_chat
FOR SELECT TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Exemplo de RLS otimizado lendo direto do JWT
CREATE POLICY "Admins gerenciam todos os livros via JWT"
ON public.livros
FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');