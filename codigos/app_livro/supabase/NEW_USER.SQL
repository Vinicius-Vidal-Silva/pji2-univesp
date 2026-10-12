-- ====================================================================================
-- GATILHO (TRIGGER) PARA SINCRONIZAR AUTH.USERS COM PUBLIC.USUARIOS
-- ====================================================================================
-- Rode este código no "SQL Editor" do seu painel do Supabase.

-- Passo 1: Criar a função que faz a cópia dos dados
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, email, nome_completo)
  values (
    new.id, -- O ID (UUID) exato gerado pelo Auth
    new.email,
    -- O React envia o nome_completo dentro do 'user_metadata', nós extraímos ele aqui:
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

-- Passo 2: Criar o gatilho que fica "escutando" a tabela auth.users
-- ATENÇÃO: Se você já rodou isso uma vez e deu erro de "trigger already exists",
-- você pode apagar o gatilho antigo com: drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Pronto! De agora em diante, qualquer cadastro pelo React, Python ou Celular
-- vai automaticamente criar a linha na tabela `public.usuarios`.