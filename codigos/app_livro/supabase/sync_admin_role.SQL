CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Se um usuário for adicionado à tabela administradores
  IF TG_OP = 'INSERT' THEN
    UPDATE auth.users
    SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
    WHERE id = NEW.id;
    RETURN NEW;
    
  -- Se um usuário for removido da tabela administradores
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE auth.users
    -- O operador '-' remove a chave 'role' do JSON
    SET raw_app_meta_data = raw_app_meta_data - 'role' 
    WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_admin_change
  AFTER INSERT OR DELETE ON public.administradores
  FOR EACH ROW EXECUTE PROCEDURE public.sync_admin_role();