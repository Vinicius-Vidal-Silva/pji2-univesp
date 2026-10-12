-- Execute no SQL Editor do Supabase para sincronizar um projeto ja existente.
-- A claim app_metadata.role fica disponivel no proximo refresh/login do usuario.

ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-perfil', 'fotos-perfil', true), ('fotos-capas', 'fotos-capas', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Visualização pública de avatares" ON storage.objects;
CREATE POLICY "Visualização pública de avatares" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'fotos-perfil');

DROP POLICY IF EXISTS "Usuário faz upload do próprio avatar" ON storage.objects;
CREATE POLICY "Usuário faz upload do próprio avatar" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'fotos-perfil' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Usuário remove o próprio avatar" ON storage.objects;
CREATE POLICY "Usuário remove o próprio avatar" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'fotos-perfil' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Visualização pública de capas" ON storage.objects;
CREATE POLICY "Visualização pública de capas" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'fotos-capas');

DROP POLICY IF EXISTS "Usuários cadastram capas de livros" ON storage.objects;
CREATE POLICY "Usuários cadastram capas de livros" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos-capas');

UPDATE auth.users AS auth_user
SET raw_app_meta_data = COALESCE(auth_user.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'admin')
FROM public.administradores AS admin
WHERE auth_user.id = admin.id
  AND auth_user.raw_app_meta_data ->> 'role' IS DISTINCT FROM 'admin';

CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'admin')
    WHERE id = NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) - 'role'
    WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_admin_change ON public.administradores;
CREATE TRIGGER on_admin_change
  AFTER INSERT OR DELETE ON public.administradores
  FOR EACH ROW EXECUTE PROCEDURE public.sync_admin_role();

-- As politicas antigas consultavam administradores sob RLS e podiam causar recursao.
DROP POLICY IF EXISTS "Admins veem admins" ON public.administradores;
DROP POLICY IF EXISTS "Admins veem todos os usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Admins gerenciam todas as propostas" ON public.propostas_troca;
DROP POLICY IF EXISTS "Admins veem todos os itens" ON public.itens_ofertados;
DROP POLICY IF EXISTS "Admins auditam chats" ON public.mensagens_chat;
DROP POLICY IF EXISTS "Admins veem tudo via JWT" ON public.propostas_troca;
DROP POLICY IF EXISTS "Admins gerenciam todas as propostas via JWT" ON public.propostas_troca;
DROP POLICY IF EXISTS "Admins gerenciam todos os livros via JWT" ON public.livros;

CREATE POLICY "Admins veem admins" ON public.administradores
FOR SELECT TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admins veem todos os usuarios" ON public.usuarios
FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admins gerenciam todas as propostas" ON public.propostas_troca
FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admins veem todos os itens" ON public.itens_ofertados
FOR SELECT TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admins auditam chats" ON public.mensagens_chat
FOR SELECT TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admins gerenciam todos os livros via JWT" ON public.livros
FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

GRANT USAGE ON SCHEMA gold TO authenticated;
GRANT SELECT ON gold.vw_fato_demanda_genero TO authenticated;
GRANT SELECT ON gold.vw_fato_tempo_troca TO authenticated;
