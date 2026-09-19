-- 1. Habilitar o RLS (Row Level Security) em todas as tabelas
alter table public.usuarios enable row level security;
alter table public.livros enable row level security;
alter table public.propostas_troca enable row level security;
alter table public.itens_ofertados enable row level security;
alter table public.wishlist enable row level security;
alter table public.mensagens_chat enable row level security;

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

-- Políticas para fotos das capas de livros
create policy "Visualização pública de capas" on storage.objects for select to public using (bucket_id = 'fotos-capas');
create policy "Usuários cadastram capas de livros" on storage.objects for insert to authenticated with check (bucket_id = 'fotos-capas');